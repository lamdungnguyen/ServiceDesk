package com.servicedesk.ticket.util;

import com.servicedesk.ticket.entity.Settings;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class BusinessTimeCalculator {

    public LocalDateTime calculateDueDate(LocalDateTime start, int hoursSLA, Settings settings) {
        if (settings == null || settings.getBusinessStartTime() == null || settings.getBusinessEndTime() == null || settings.getWorkDays() == null) {
            return start.plusHours(hoursSLA);
        }

        LocalTime businessStart = LocalTime.parse(settings.getBusinessStartTime());
        LocalTime businessEnd = LocalTime.parse(settings.getBusinessEndTime());
        Set<DayOfWeek> workDays = Arrays.stream(settings.getWorkDays().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toSet());

        LocalDateTime current = start;
        current = adjustToBusinessHours(current, businessStart, businessEnd, workDays);

        long remainingMinutes = hoursSLA * 60L;

        while (remainingMinutes > 0) {
            LocalDateTime endOfDay = current.toLocalDate().atTime(businessEnd);
            long minutesLeftToday = java.time.Duration.between(current, endOfDay).toMinutes();

            if (minutesLeftToday >= remainingMinutes) {
                current = current.plusMinutes(remainingMinutes);
                remainingMinutes = 0;
            } else {
                remainingMinutes -= minutesLeftToday;
                current = adjustToBusinessHours(endOfDay.plusMinutes(1), businessStart, businessEnd, workDays);
            }
        }
        
        return current;
    }

    private LocalDateTime adjustToBusinessHours(LocalDateTime current, LocalTime start, LocalTime end, Set<DayOfWeek> workDays) {
        while (true) {
            boolean isWorkDay = workDays.contains(current.getDayOfWeek());
            boolean isBeforeStart = current.toLocalTime().isBefore(start);
            boolean isAfterOrAtEnd = !current.toLocalTime().isBefore(end);

            if (!isWorkDay || isAfterOrAtEnd) {
                current = current.plusDays(1).toLocalDate().atTime(start);
            } else if (isBeforeStart) {
                current = current.toLocalDate().atTime(start);
            } else {
                break;
            }
        }
        return current;
    }
}
