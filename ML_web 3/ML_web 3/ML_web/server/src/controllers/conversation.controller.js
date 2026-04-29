const Joi = require("joi");
const {
  Employee,
  Customer,
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore
} = require("../db/models");

const ingestSchema = Joi.object({
  employeeName: Joi.string().min(2).required(),
  team: Joi.string().default("General"),
  customerName: Joi.string().min(2).required(),
  language: Joi.string().valid("vi", "en", "mix").default("en"),
  status: Joi.string().valid("open", "resolved", "pending").default("resolved"),
  messages: Joi.array()
    .items(
      Joi.object({
        senderType: Joi.string().valid("employee", "customer").required(),
        text: Joi.string().min(1).required(),
        sentAt: Joi.date().optional()
      })
    )
    .min(2)
    .required()
});

function enrichMessages(messages) {
  let previousCustomerMessageAt = null;

  return messages.map((message, index) => {
    const sentAt = message.sentAt ? new Date(message.sentAt) : new Date(Date.now() + index * 45000);

    if (message.senderType === "customer") {
      previousCustomerMessageAt = sentAt;
      return { ...message, sentAt, responseTimeSec: null };
    }

    const responseTimeSec = previousCustomerMessageAt
      ? Number(((sentAt.getTime() - previousCustomerMessageAt.getTime()) / 1000).toFixed(2))
      : null;

    return { ...message, sentAt, responseTimeSec };
  });
}

async function ingestConversation(req, res, next) {
  try {
    const { value, error } = ingestSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: error.details.map((item) => item.message).join("; ")
      });
    }

    const [employee] = await Employee.findOrCreate({
      where: { name: value.employeeName },
      defaults: { team: value.team }
    });

    if (employee.team !== value.team) {
      employee.team = value.team;
      await employee.save();
    }

    const [customer] = await Customer.findOrCreate({
      where: { name: value.customerName }
    });

    const preparedMessages = enrichMessages(value.messages);

    const conversation = await Conversation.create({
      employee_id: employee.id,
      customer_id: customer.id,
      language: value.language,
      status: value.status,
      startedAt: preparedMessages[0].sentAt,
      endedAt: preparedMessages[preparedMessages.length - 1].sentAt
    });

    await Message.bulkCreate(
      preparedMessages.map((item) => ({
        conversation_id: conversation.id,
        senderType: item.senderType,
        text: item.text,
        sentAt: item.sentAt,
        responseTimeSec: item.responseTimeSec
      }))
    );

    const conversationWithMessages = await Conversation.findByPk(conversation.id, {
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message, order: [["sentAt", "ASC"]] }
      ]
    });

    return res.status(201).json(conversationWithMessages);
  } catch (error) {
    return next(error);
  }
}

async function listConversations(req, res, next) {
  try {
    const { language, employeeId } = req.query;

    const where = {};
    if (language && language !== "all") {
      where.language = language;
    }

    if (employeeId && employeeId !== "all" && !isNaN(Number(employeeId))) {
      where.employee_id = Number(employeeId);
    }

    const conversations = await Conversation.findAll({
      where,
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message },
        { model: AnalysisResult },
        { model: PerformanceScore }
      ],
      order: [["createdAt", "DESC"]],
      limit: 100
    });

    return res.json(conversations);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  ingestConversation,
  listConversations
};
