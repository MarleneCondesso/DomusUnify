package com.domusunify.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.content.ContextCompat;

import com.domusunify.app.R;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.List;
import java.util.Locale;

final class WidgetRenderers {
    private static final int[] WEEK_DAY_CONTAINER_IDS = {
        R.id.widget_calendar_week_day0,
        R.id.widget_calendar_week_day1,
        R.id.widget_calendar_week_day2,
        R.id.widget_calendar_week_day3,
        R.id.widget_calendar_week_day4,
        R.id.widget_calendar_week_day5,
        R.id.widget_calendar_week_day6
    };

    private static final int[] WEEK_DAY_LABEL_IDS = {
        R.id.widget_calendar_week_day0_label,
        R.id.widget_calendar_week_day1_label,
        R.id.widget_calendar_week_day2_label,
        R.id.widget_calendar_week_day3_label,
        R.id.widget_calendar_week_day4_label,
        R.id.widget_calendar_week_day5_label,
        R.id.widget_calendar_week_day6_label
    };

    private static final int[] WEEK_DAY_META_IDS = {
        R.id.widget_calendar_week_day0_meta,
        R.id.widget_calendar_week_day1_meta,
        R.id.widget_calendar_week_day2_meta,
        R.id.widget_calendar_week_day3_meta,
        R.id.widget_calendar_week_day4_meta,
        R.id.widget_calendar_week_day5_meta,
        R.id.widget_calendar_week_day6_meta
    };

    private static final int[] WEEK_DAY_EVENT1_IDS = {
        R.id.widget_calendar_week_day0_event1,
        R.id.widget_calendar_week_day1_event1,
        R.id.widget_calendar_week_day2_event1,
        R.id.widget_calendar_week_day3_event1,
        R.id.widget_calendar_week_day4_event1,
        R.id.widget_calendar_week_day5_event1,
        R.id.widget_calendar_week_day6_event1
    };

    private static final int[] WEEK_DAY_EVENT2_IDS = {
        R.id.widget_calendar_week_day0_event2,
        R.id.widget_calendar_week_day1_event2,
        R.id.widget_calendar_week_day2_event2,
        R.id.widget_calendar_week_day3_event2,
        R.id.widget_calendar_week_day4_event2,
        R.id.widget_calendar_week_day5_event2,
        R.id.widget_calendar_week_day6_event2
    };

    private static final int[] DAY_EVENT_IDS = {
        R.id.widget_calendar_day_event1,
        R.id.widget_calendar_day_event2,
        R.id.widget_calendar_day_event3
    };

    private static final DateTimeFormatter WEEK_RANGE_FORMAT = DateTimeFormatter.ofPattern("d MMM", Locale.getDefault());
    private static final DateTimeFormatter WEEKDAY_FORMAT = DateTimeFormatter.ofPattern("EEE d", Locale.getDefault());
    private static final DateTimeFormatter DAY_TITLE_FORMAT = DateTimeFormatter.ofPattern("EEEE, d MMM", Locale.getDefault());
    private static final DateTimeFormatter DAY_SUBTITLE_FORMAT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.getDefault());
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault());

    private WidgetRenderers() {
    }

    static void renderCalendarWeek(
        Context context,
        AppWidgetManager manager,
        int[] widgetIds,
        WidgetStateStore.State state,
        WidgetModels.CalendarSnapshot snapshot
    ) {
        for (int widgetId : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar_week);
            views.setOnClickPendingIntent(
                R.id.widget_calendar_week_root,
                WidgetDeepLinks.openApp(context, snapshot != null ? snapshot.largeDeepLink : "/#/", 1000 + widgetId)
            );

            if (!state.isReady()) {
                views.setTextViewText(R.id.widget_calendar_week_subtitle, context.getString(R.string.widget_signed_out));
                collapseWeekDays(views);
            } else if (snapshot == null) {
                views.setTextViewText(R.id.widget_calendar_week_subtitle, context.getString(R.string.widget_error));
                collapseWeekDays(views);
            } else {
                views.setTextViewText(
                    R.id.widget_calendar_week_subtitle,
                    WEEK_RANGE_FORMAT.format(snapshot.weekStart) + " - " + WEEK_RANGE_FORMAT.format(snapshot.weekEnd)
                );
                bindWeekDays(context, views, snapshot.week);
            }

            manager.updateAppWidget(widgetId, views);
        }
    }

    static void renderCalendarDay(
        Context context,
        AppWidgetManager manager,
        int[] widgetIds,
        WidgetStateStore.State state,
        WidgetModels.CalendarSnapshot snapshot
    ) {
        for (int widgetId : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar_day);
            views.setOnClickPendingIntent(
                R.id.widget_calendar_day_root,
                WidgetDeepLinks.openApp(context, snapshot != null ? snapshot.smallDeepLink : "/#/calendar", 2000 + widgetId)
            );

            if (!state.isReady()) {
                views.setTextViewText(R.id.widget_calendar_day_title, context.getString(R.string.widget_day_title));
                views.setTextViewText(R.id.widget_calendar_day_subtitle, context.getString(R.string.widget_signed_out));
                clearDayEvents(views);
            } else if (snapshot == null || snapshot.today == null) {
                views.setTextViewText(R.id.widget_calendar_day_title, context.getString(R.string.widget_day_title));
                views.setTextViewText(R.id.widget_calendar_day_subtitle, context.getString(R.string.widget_error));
                clearDayEvents(views);
            } else {
                views.setTextViewText(R.id.widget_calendar_day_title, capitalize(snapshot.today.format(DAY_TITLE_FORMAT)));
                views.setTextViewText(R.id.widget_calendar_day_subtitle, snapshot.today.format(DAY_SUBTITLE_FORMAT));

                if (snapshot.dailyEvents.isEmpty()) {
                    clearDayEvents(views);
                } else {
                    bindDayEvents(context, views, snapshot.dailyEvents);
                }
            }

            manager.updateAppWidget(widgetId, views);
        }
    }

    static void renderBudget(
        Context context,
        AppWidgetManager manager,
        int[] widgetIds,
        WidgetStateStore.State state,
        WidgetModels.BudgetSnapshot snapshot
    ) {
        for (int widgetId : widgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_budget_summary);
            views.setOnClickPendingIntent(
                R.id.widget_budget_root,
                WidgetDeepLinks.openApp(context, snapshot != null ? snapshot.deepLink : "/#/", 3000 + widgetId)
            );

            if (!state.isReady()) {
                views.setTextViewText(R.id.widget_budget_title, context.getString(R.string.widget_budget_title));
                views.setTextViewText(R.id.widget_budget_subtitle, context.getString(R.string.widget_signed_out));
                views.setTextViewText(R.id.widget_budget_month_value, "—");
                views.setTextViewText(R.id.widget_budget_today_value, "—");
            } else if (snapshot == null) {
                views.setTextViewText(R.id.widget_budget_title, context.getString(R.string.widget_budget_title));
                views.setTextViewText(R.id.widget_budget_subtitle, context.getString(R.string.widget_error));
                views.setTextViewText(R.id.widget_budget_month_value, "—");
                views.setTextViewText(R.id.widget_budget_today_value, "—");
            } else if (!snapshot.hasBudget) {
                views.setTextViewText(R.id.widget_budget_title, context.getString(R.string.widget_budget_empty_title));
                views.setTextViewText(R.id.widget_budget_subtitle, context.getString(R.string.widget_budget_empty_subtitle));
                views.setTextViewText(R.id.widget_budget_month_value, "—");
                views.setTextViewText(R.id.widget_budget_today_value, "—");
            } else {
                views.setTextViewText(
                    R.id.widget_budget_title,
                    snapshot.budgetName != null ? snapshot.budgetName : context.getString(R.string.widget_budget_title)
                );
                views.setTextViewText(R.id.widget_budget_subtitle, snapshot.currencyCode != null ? snapshot.currencyCode : "");
                views.setTextViewText(R.id.widget_budget_month_value, formatCurrency(snapshot.monthExpenses, snapshot.currencyCode));
                views.setTextViewText(R.id.widget_budget_today_value, formatCurrency(snapshot.todayExpenses, snapshot.currencyCode));
            }

            manager.updateAppWidget(widgetId, views);
        }
    }

    private static void collapseWeekDays(RemoteViews views) {
        for (int i = 0; i < WEEK_DAY_CONTAINER_IDS.length; i++) {
            views.setViewVisibility(WEEK_DAY_CONTAINER_IDS[i], View.GONE);
        }
    }

    private static void bindWeekDays(Context context, RemoteViews views, List<WidgetModels.CalendarDay> week) {
        int baseTextColor = ContextCompat.getColor(context, R.color.widget_forest_deep);
        int baseMutedColor = ContextCompat.getColor(context, R.color.widget_muted);
        int baseEventColor = ContextCompat.getColor(context, R.color.widget_forest);
        int inverseColor = ContextCompat.getColor(context, R.color.widget_white);

        for (int i = 0; i < WEEK_DAY_CONTAINER_IDS.length; i++) {
            if (i >= week.size()) {
                views.setViewVisibility(WEEK_DAY_CONTAINER_IDS[i], View.GONE);
                continue;
            }

            WidgetModels.CalendarDay day = week.get(i);
            views.setViewVisibility(WEEK_DAY_CONTAINER_IDS[i], View.VISIBLE);
            views.setInt(
                WEEK_DAY_CONTAINER_IDS[i],
                "setBackgroundResource",
                day.isToday ? R.drawable.widget_day_cell_today_bg : R.drawable.widget_day_cell_bg
            );

            int labelColor = day.isToday ? inverseColor : baseTextColor;
            int metaColor = day.isToday ? inverseColor : baseMutedColor;
            int fallbackEventColor = day.isToday ? inverseColor : baseEventColor;

            views.setTextColor(WEEK_DAY_LABEL_IDS[i], labelColor);
            views.setTextColor(WEEK_DAY_META_IDS[i], metaColor);
            views.setTextViewText(WEEK_DAY_LABEL_IDS[i], capitalize(day.date.format(WEEKDAY_FORMAT)));
            views.setTextViewText(
                WEEK_DAY_META_IDS[i],
                day.eventCount > 0 ? day.eventCount + " evento" + (day.eventCount == 1 ? "" : "s") : context.getString(R.string.widget_calendar_no_events)
            );

            bindWeekEventLine(views, WEEK_DAY_EVENT1_IDS[i], day.events, 0, fallbackEventColor);
            bindWeekEventLine(views, WEEK_DAY_EVENT2_IDS[i], day.events, 1, fallbackEventColor);
        }
    }

    private static void bindWeekEventLine(
        RemoteViews views,
        int viewId,
        List<WidgetModels.CalendarEvent> events,
        int index,
        int fallbackColor
    ) {
        if (index >= events.size()) {
            views.setTextViewText(viewId, "");
            views.setViewVisibility(viewId, View.GONE);
            return;
        }

        WidgetModels.CalendarEvent event = events.get(index);
        views.setViewVisibility(viewId, View.VISIBLE);
        views.setTextViewText(viewId, formatEventLine(event));
        views.setTextColor(viewId, parseColor(event.colorHex, fallbackColor));
    }

    private static void clearDayEvents(RemoteViews views) {
        for (int eventId : DAY_EVENT_IDS) {
            views.setTextViewText(eventId, "");
            views.setViewVisibility(eventId, View.GONE);
        }
    }

    private static void bindDayEvents(Context context, RemoteViews views, List<WidgetModels.CalendarEvent> events) {
        int fallbackColor = ContextCompat.getColor(context, R.color.widget_forest);

        for (int i = 0; i < DAY_EVENT_IDS.length; i++) {
            if (i >= events.size()) {
                views.setTextViewText(DAY_EVENT_IDS[i], "");
                views.setViewVisibility(DAY_EVENT_IDS[i], View.GONE);
                continue;
            }

            WidgetModels.CalendarEvent event = events.get(i);
            views.setViewVisibility(DAY_EVENT_IDS[i], View.VISIBLE);
            views.setTextViewText(DAY_EVENT_IDS[i], formatEventLine(event));
            views.setTextColor(DAY_EVENT_IDS[i], parseColor(event.colorHex, fallbackColor));
        }
    }

    private static String formatEventLine(WidgetModels.CalendarEvent event) {
        if (event == null) return "";
        if (event.isAllDay) return event.title;

        OffsetDateTime start = event.startUtc;
        if (start == null) return event.title;

        return start.atZoneSameInstant(ZoneId.systemDefault()).format(TIME_FORMAT) + " · " + event.title;
    }

    private static String formatCurrency(BigDecimal amount, String currencyCode) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.getDefault());
        if (currencyCode != null && !currencyCode.isBlank()) {
            try {
                formatter.setCurrency(Currency.getInstance(currencyCode));
            } catch (IllegalArgumentException ignored) {
            }
        }
        return formatter.format(amount);
    }

    private static int parseColor(String colorHex, int fallback) {
        if (colorHex == null || colorHex.isBlank()) return fallback;
        try {
            return Color.parseColor(colorHex.trim());
        } catch (IllegalArgumentException ignored) {
            return fallback;
        }
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) return "";
        return value.substring(0, 1).toUpperCase(Locale.getDefault()) + value.substring(1);
    }
}
