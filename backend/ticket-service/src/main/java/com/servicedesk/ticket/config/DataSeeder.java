package com.servicedesk.ticket.config;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    private static class TicketTemplate {
        String title;
        String description;
        String category;
        Priority priority;

        TicketTemplate(String title, String description, String category, Priority priority) {
            this.title = title;
            this.description = description;
            this.category = category;
            this.priority = priority;
        }
    }

    @Override
    public void run(String... args) {
        // Seed Admin Account
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("123456"))
                    .name("System Administrator")
                    .email("admin@servicedesk.local")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created: username=admin, password=123456");
        } else {
            log.info("Admin account already exists, skipping seed.");
        }

        // Seed Customer 1 (Alice Smith)
        User customer1;
        if (!userRepository.existsByUsername("customer1")) {
            customer1 = User.builder()
                    .username("customer1")
                    .password(passwordEncoder.encode("123456"))
                    .name("Alice Smith")
                    .email("alice.smith@local.com")
                    .role(UserRole.CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .build();
            customer1 = userRepository.save(customer1);
            log.info("Default customer account created: username=customer1, password=123456");
        } else {
            customer1 = userRepository.findByUsername("customer1").orElse(null);
        }

        // Seed Customer 2 (Bob Jones)
        User customer2;
        if (!userRepository.existsByUsername("customer2")) {
            customer2 = User.builder()
                    .username("customer2")
                    .password(passwordEncoder.encode("123456"))
                    .name("Bob Jones")
                    .email("bob.jones@local.com")
                    .role(UserRole.CUSTOMER)
                    .status(UserStatus.ACTIVE)
                    .build();
            customer2 = userRepository.save(customer2);
            log.info("Default customer account created: username=customer2, password=123456");
        } else {
            customer2 = userRepository.findByUsername("customer2").orElse(null);
        }

        // Seed Tickets for Customer 1
        if (customer1 != null) {
            List<Ticket> oldTickets = ticketRepository.findByReporterId(customer1.getId());
            if (!oldTickets.isEmpty()) {
                ticketRepository.deleteAll(oldTickets);
                log.info("Cleared old tickets for customer1 to refresh SLA status.");
            }
            log.info("Seeding 50 fresh tickets for customer1...");
            seedTicketsForUser(customer1, getTemplatesForUser1());
        }

        // Seed Tickets for Customer 2
        if (customer2 != null) {
            List<Ticket> oldTickets = ticketRepository.findByReporterId(customer2.getId());
            if (!oldTickets.isEmpty()) {
                ticketRepository.deleteAll(oldTickets);
                log.info("Cleared old tickets for customer2 to refresh SLA status.");
            }
            log.info("Seeding 50 fresh tickets for customer2...");
            seedTicketsForUser(customer2, getTemplatesForUser2());
        }
    }

    private void seedTicketsForUser(User user, List<TicketTemplate> templates) {
        for (int i = 0; i < templates.size(); i++) {
            TicketTemplate template = templates.get(i);
            
            // Distribute creation time nicely within the last 4 hours
            LocalDateTime createdAt = LocalDateTime.now()
                    .minusMinutes((templates.size() - i) * 4);
            
            LocalDateTime dueDate = calculateDueDate(createdAt, template.priority);

            Ticket ticket = Ticket.builder()
                    .title(template.title)
                    .description(template.description)
                    .category(template.category)
                    .priority(template.priority)
                    .status(TicketStatus.NEW)
                    .reporterId(user.getId())
                    .reporterName(user.getName())
                    .reporterEmail(user.getEmail())
                    .createdAt(createdAt)
                    .updatedAt(createdAt)
                    .dueDate(dueDate)
                    .slaNotified(false)
                    .overdueNotified(false)
                    .escalated(false)
                    .build();

            ticketRepository.save(ticket);
        }
        log.info("Successfully seeded {} tickets for user: {}", templates.size(), user.getUsername());
    }

    private LocalDateTime calculateDueDate(LocalDateTime createdAt, Priority priority) {
        if (priority == null) return createdAt.plusDays(3);
        switch (priority) {
            case URGENT: return createdAt.plusHours(8);
            case HIGH: return createdAt.plusDays(1);
            case MEDIUM: return createdAt.plusDays(3);
            case LOW:
            default: return createdAt.plusDays(5);
        }
    }

    private List<TicketTemplate> getTemplatesForUser1() {
        List<TicketTemplate> list = new ArrayList<>();
        list.add(new TicketTemplate("Slow internet connection at desk 102", "The network speed has been extremely slow since morning, web pages take forever to load.", "NETWORK", Priority.MEDIUM));
        list.add(new TicketTemplate("VPN client disconnects every 10 minutes", "My corporate VPN connection is highly unstable. It keeps disconnecting and reconnecting.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Cannot connect to WiFi 'ServiceDesk_Staff'", "I am getting an authentication error when trying to connect my work laptop to the staff WiFi.", "NETWORK", Priority.MEDIUM));
        list.add(new TicketTemplate("No ethernet link light on docking station", "The wired network connection on my desk dock is not working. The green link light is off.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("Cannot access internal staging database server", "Getting connection timeout when trying to query the staging database at 10.0.4.15.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Slow download speed on corporate network", "Downloading files from external repositories is taking hours. Speed test shows under 2 Mbps.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("DNS resolution failing on work laptop", "I cannot access any website. Ping shows 'DNS server not responding'. Please help.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Guest WiFi captive portal not appearing", "Connecting to the Guest network works, but the login prompt page never displays.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("Password reset for active directory account", "Forgot my password. I need my Active Directory account password reset.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Account locked after incorrect passwords", "My Windows login account is locked because I mistyped my password too many times.", "ACCOUNT", Priority.HIGH));
        list.add(new TicketTemplate("Request access to Git repository 'ticket-ui'", "I need Developer role access to the 'ticket-ui' project in GitLab to start coding.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Shared drive access request - Finance folder", "Requesting read and write permissions to the Finance folder on the company Shared Drive.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Requesting access to Jira board for Project Alpha", "Please add my user to the Project Alpha Jira board so I can pick up tasks.", "ACCOUNT", Priority.LOW));
        list.add(new TicketTemplate("Multi-factor authentication (MFA) reset request", "I got a new phone and need to register my authenticator app for corporate login.", "ACCOUNT", Priority.HIGH));
        list.add(new TicketTemplate("Need temporary admin rights for local machine", "I need to run local commands that require admin privilege. Requesting temporary access.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Email alias creation request", "Please create an email alias 'alice.s@servicedesk.local' pointing to my main mailbox.", "ACCOUNT", Priority.LOW));
        list.add(new TicketTemplate("IntelliJ IDEA fails to launch after updating", "Clicking the IntelliJ icon does nothing. Windows Event Viewer shows a JVM crash.", "SOFTWARE", Priority.HIGH));
        list.add(new TicketTemplate("Docker Desktop fails to start container service", "Getting error 'Docker daemon is not running'. Tried restarting the desktop app.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Need admin permission to install Node.js", "I need to install Node.js v20 for development. The installer requires admin credentials.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Outlook stuck in 'Disconnected' status", "My Microsoft Outlook client is offline and won't reconnect to the Exchange server.", "SOFTWARE", Priority.HIGH));
        list.add(new TicketTemplate("Slack crashes immediately on startup", "Slack desktop client opens for a second and then crashes. Web client works fine.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Postman installation request", "Requesting installation of Postman Desktop agent to test API endpoints locally.", "SOFTWARE", Priority.LOW));
        list.add(new TicketTemplate("Zoom app crashes when joining a meeting", "Every time I click a join link, Zoom crashes. I have to use the web browser version.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("PDF Reader license activation issue", "Adobe Acrobat says my license has expired. Please check my subscription status.", "SOFTWARE", Priority.LOW));
        list.add(new TicketTemplate("Laptop keyboard keys 'U', 'I', 'O' not working", "These keys are completely dead. I have to use an external keyboard right now.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Laptop screen flickering continuously", "The built-in display keeps flashing and has thin green lines across it.", "HARDWARE", Priority.HIGH));
        list.add(new TicketTemplate("Wireless mouse USB receiver is broken", "The USB dongle for my Logitech mouse is broken. Can I get a replacement?", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Laptop running extremely hot with loud fan", "The fan makes a grinding noise and the laptop gets hot enough to throttle performance.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Request for RAM upgrade from 8GB to 16GB", "IntelliJ and Docker together consume all 8GB of RAM, causing system freezes.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("External monitor has no signal via HDMI", "My Dell monitor says 'No HDMI Cable detected' even though it is plugged into my hub.", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Webcam not detected on laptop", "Windows Device Manager shows 'No webcam found'. I cannot join video calls.", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Headset microphone is not picking up audio", "I can hear others in Teams calls, but my microphone is silent. Tested on other PCs.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("USB-C hub docking station ports dead", "The USB ports on my docking station are not detecting flash drives or keyboards.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Laptop battery draining in under an hour", "The battery health report shows degraded status. Need a battery replacement.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Conference Room A projector no signal", "No signal from the HDMI cable on the wall. The wall panel status light is red.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Printer on 3rd floor paper jam in tray 2", "The main printer has a paper jam warning, but opening the tray shows no paper.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Standing desk motor stuck in low position", "The height adjustment controller is dead and the desk won't go up.", "INFRASTRUCTURE", Priority.LOW));
        list.add(new TicketTemplate("AC unit in Room 102 dripping water", "The air conditioning unit is leaking water onto the floor. Please notify maintenance.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Office door lock card reader unresponsive", "The badge scanner for the server room door does not beep or flash green.", "INFRASTRUCTURE", Priority.HIGH));
        list.add(new TicketTemplate("No power at wall outlets in Row D", "All power outlets on the floor in Row D are dead. Multiple laptops are dying.", "INFRASTRUCTURE", Priority.URGENT));
        list.add(new TicketTemplate("Request for second external monitor", "I need another 24-inch monitor for my workstation to help with coding.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Lost office building security badge", "I misplaced my physical entry card yesterday and need a replacement card issued.", "GENERAL", Priority.HIGH));
        list.add(new TicketTemplate("Office chair gas cylinder slowly sinking", "My desk chair slowly sinks to the floor when I sit on it. Cylinder is leaking.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Whiteboard markers in Room C are dried out", "None of the markers in meeting room C work. Please restock them.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Request for ergonomic wrist rest", "Need a keyboard and mouse wrist rest to help prevent strain during long typing sessions.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Request for cabinet keys", "I need the keys to the lockable filing cabinet next to my desk.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Coffee machine on floor 2 not heating", "The coffee maker is running water but it is completely cold. Please call service.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Missing desk partition screen", "Requesting a privacy panel/screen to be installed between my desk and desk 103.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Request for cleaning of desk area", "There was a coffee spill on my desk from the cleaning crew last night. Needs deep cleaning.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Need a new notebook and pens", "Requesting standard office supplies: a notebook, sticky notes, and blue pens.", "GENERAL", Priority.LOW));
        return list;
    }

    private List<TicketTemplate> getTemplatesForUser2() {
        List<TicketTemplate> list = new ArrayList<>();
        list.add(new TicketTemplate("Slow WiFi speeds in office room 302", "I am getting very slow network speeds on the staff WiFi in room 302. Page loads timeout.", "NETWORK", Priority.MEDIUM));
        list.add(new TicketTemplate("VPN gateway connection timeout error", "My corporate VPN fails to connect. It shows 'Gateway connection timeout'.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Failed to connect to staff WiFi network", "I cannot connect to 'ServiceDesk_Staff' on my phone or laptop. Authentication keeps failing.", "NETWORK", Priority.MEDIUM));
        list.add(new TicketTemplate("Ethernet cable not showing connection at desk 215", "No internet connection when plugging in the LAN cable at desk 215. Link light is black.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("Cannot access internal database on port 5432", "Staging database on 10.0.4.15 is unreachable. Getting connection timed out.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Extremely slow download speeds today", "Our office internet is very sluggish. File downloads from GitHub are taking forever.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("DNS server not responding on my computer", "I've lost internet access. Diagnostic tool says the primary DNS server is down.", "NETWORK", Priority.HIGH));
        list.add(new TicketTemplate("Guest WiFi login portal does not open", "When I join the Guest WiFi, it connects but the landing page to enter credentials won't load.", "NETWORK", Priority.LOW));
        list.add(new TicketTemplate("Forgotten password reset - Active Directory", "I need my Windows AD password reset because I cannot remember it.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Domain account locked out", "I am locked out of my corporate login account after three incorrect password entries.", "ACCOUNT", Priority.HIGH));
        list.add(new TicketTemplate("GitLab repository access request - frontend", "Please grant me developer access to the 'ticket-ui' project repository on GitLab.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Request read/write access to HR Shared Drive folder", "I need access permissions for the HR directory on the shared drive.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Request to join Jira project board", "Please add me to the Jira board for Project Alpha. My role is Developer.", "ACCOUNT", Priority.LOW));
        list.add(new TicketTemplate("Reset my MFA authenticator settings", "I lost my phone and need my Microsoft Authenticator MFA token reset.", "ACCOUNT", Priority.HIGH));
        list.add(new TicketTemplate("Local administrator access request", "I need temporary local administrator privileges to install development tools.", "ACCOUNT", Priority.MEDIUM));
        list.add(new TicketTemplate("Create email alias for my account", "Please create email alias 'bob.j@servicedesk.local' for my primary mailbox.", "ACCOUNT", Priority.LOW));
        list.add(new TicketTemplate("IntelliJ IDEA crashes with JVM error on startup", "After update, IntelliJ crashes on launch. Event viewer points to JVM.", "SOFTWARE", Priority.HIGH));
        list.add(new TicketTemplate("Docker Desktop daemon not running error", "My Docker Desktop client won't start. It keeps showing 'starting daemon' forever.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Request node.js installation help", "Need help installing Node.js v20. It requires admin credentials which I don't have.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Outlook status stuck on Disconnected", "My Outlook desktop application is disconnected from the mail server. No mails loading.", "SOFTWARE", Priority.HIGH));
        list.add(new TicketTemplate("Slack desktop application keeps crashing", "Slack client closes immediately after launch. I am currently using the web version.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Request Postman desktop installation", "I need the Postman client installed on my workstation to verify APIs.", "SOFTWARE", Priority.LOW));
        list.add(new TicketTemplate("Zoom app crashes during meeting connect", "Zoom app crashes to desktop every time I try to join a video call.", "SOFTWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Adobe PDF Reader license activation error", "My Adobe Acrobat Pro license is showing as expired. Can someone reactivate it?", "SOFTWARE", Priority.LOW));
        list.add(new TicketTemplate("Unresponsive keys on laptop keyboard", "Laptop keyboard has dead keys: U, I, O are not working at all.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Laptop display flickering with green lines", "The built-in screen is flickering and there are lines across the display.", "HARDWARE", Priority.HIGH));
        list.add(new TicketTemplate("Wireless mouse receiver USB dongle replacement", "The USB adapter for my wireless mouse is broken. Requesting a replacement.", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Laptop overheating and loud fan sound", "My laptop is overheating quickly and the fan is constantly running at maximum speed.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Need RAM upgrade to 16GB", "Requesting additional 8GB of RAM. The current 8GB is causing severe slowdowns with Docker.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("External monitor not showing display via HDMI", "Dell monitor says no signal when connected via HDMI through the dock.", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Integrated webcam not detected by Windows", "Webcam is not showing up in Device Manager or inside video calling apps.", "HARDWARE", Priority.LOW));
        list.add(new TicketTemplate("Headset mic not working in Teams calls", "Audio works fine but my microphone doesn't capture any sound during calls.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("USB-C docking station USB ports stopped working", "The USB ports on my type-C hub are not recognizing any connected devices.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Laptop battery draining very quickly", "Battery dies in less than 45 minutes on a full charge. Need a replacement.", "HARDWARE", Priority.MEDIUM));
        list.add(new TicketTemplate("Conference Room A HDMI connection issue", "The projector in Room A shows 'No Signal' when plugging in the HDMI cable.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Office printer Tray 2 paper jam error", "Printer shows paper jam in tray 2 but we checked and it is empty.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Adjustable desk motor unresponsive", "Standing desk is stuck in the low position. Controller screen is completely dark.", "INFRASTRUCTURE", Priority.LOW));
        list.add(new TicketTemplate("Leaking air conditioner in Room 102", "Water is dripping from the AC unit in room 102. Risk of slipping.", "INFRASTRUCTURE", Priority.MEDIUM));
        list.add(new TicketTemplate("Badge reader not working on server room door", "Card scanner on the server room door does not register or beep when swiping.", "INFRASTRUCTURE", Priority.HIGH));
        list.add(new TicketTemplate("No power at floor outlets in Row D", "Wall/floor plugs at Row D are not supplying electricity. Laptops are running out of power.", "INFRASTRUCTURE", Priority.URGENT));
        list.add(new TicketTemplate("Request second monitor for office desk", "Would like to request a secondary 24-inch monitor for development tasks.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Lost my building entry badge", "Lost my security badge and need a replacement card to enter the office.", "GENERAL", Priority.HIGH));
        list.add(new TicketTemplate("My office chair gas cylinder is leaking", "Desk chair is sinking down to the lowest level by itself. Need a replacement cylinder.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Restock whiteboard markers in Meeting Room C", "All dry erase markers in Room C are dry. Need new ones for brainstorm.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Request ergonomic wrist rest pad", "Need a wrist rest pad for keyboard and mouse to alleviate strain.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Cabinet keys missing for my desk drawer", "I need replacement keys for the drawer under my desk.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Office coffee maker on floor 2 is broken", "Water from coffee maker is cold. Please get the machine repaired.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Request desk privacy partition screen", "Need a divider partition between my desk and desk 103.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Coffee spill on my desk office workstation", "Spilled drink on desk area needs cleaning by the cleaning team.", "GENERAL", Priority.LOW));
        list.add(new TicketTemplate("Office stationery request notebook and pens", "Requesting a fresh notebook and some pens for notes.", "GENERAL", Priority.LOW));
        return list;
    }
}

