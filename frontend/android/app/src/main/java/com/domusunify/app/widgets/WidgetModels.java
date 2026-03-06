package com.domusunify.app.widgets;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

final class WidgetModels {
    private WidgetModels() {
    }

    static final class CalendarSnapshot {
        LocalDate today;
        LocalDate weekStart;
        LocalDate weekEnd;
        String largeDeepLink = "/#/";
        String smallDeepLink = "/#/";
        final List<CalendarDay> week = new ArrayList<>();
        final List<CalendarEvent> dailyEvents = new ArrayList<>();
    }

    static final class CalendarDay {
        LocalDate date;
        boolean isToday;
        int eventCount;
        final List<CalendarEvent> events = new ArrayList<>();
    }

    static final class CalendarEvent {
        String title = "";
        OffsetDateTime startUtc;
        OffsetDateTime endUtc;
        boolean isAllDay;
        String colorHex;
    }

    static final class BudgetSnapshot {
        boolean hasBudget;
        String budgetName;
        String currencyCode;
        BigDecimal monthExpenses = BigDecimal.ZERO;
        BigDecimal todayExpenses = BigDecimal.ZERO;
        String deepLink = "/#/";
    }
}
