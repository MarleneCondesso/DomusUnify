package com.domusunify.app.widgets;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

final class WidgetDataClient {
    private WidgetDataClient() {
    }

    static WidgetModels.CalendarSnapshot fetchCalendarSnapshot(WidgetStateStore.State state) throws IOException, JSONException {
        JSONObject root = requestJson(state, "/api/v1/widgets/calendar");

        WidgetModels.CalendarSnapshot snapshot = new WidgetModels.CalendarSnapshot();
        snapshot.today = LocalDate.parse(root.optString("today"));
        snapshot.weekStart = LocalDate.parse(root.optString("weekStart"));
        snapshot.weekEnd = LocalDate.parse(root.optString("weekEnd"));
        snapshot.largeDeepLink = root.optString("largeDeepLink", "/#/calendar");
        snapshot.smallDeepLink = root.optString("smallDeepLink", "/#/calendar");

        JSONArray week = root.optJSONArray("week");
        if (week != null) {
            for (int i = 0; i < week.length(); i++) {
                JSONObject item = week.optJSONObject(i);
                if (item == null) continue;

                WidgetModels.CalendarDay day = new WidgetModels.CalendarDay();
                day.date = LocalDate.parse(item.optString("date"));
                day.isToday = item.optBoolean("isToday");
                day.eventCount = item.optInt("eventCount");
                parseEvents(item.optJSONArray("events"), day.events);
                snapshot.week.add(day);
            }
        }

        parseEvents(root.optJSONArray("dailyEvents"), snapshot.dailyEvents);
        return snapshot;
    }

    static WidgetModels.BudgetSnapshot fetchBudgetSnapshot(WidgetStateStore.State state) throws IOException, JSONException {
        JSONObject root = requestJson(state, "/api/v1/widgets/budget");

        WidgetModels.BudgetSnapshot snapshot = new WidgetModels.BudgetSnapshot();
        snapshot.hasBudget = root.optBoolean("hasBudget");
        snapshot.budgetName = emptyToNull(root.optString("budgetName", null));
        snapshot.currencyCode = emptyToNull(root.optString("currencyCode", null));
        snapshot.monthExpenses = parseAmount(root.opt("monthExpenses"));
        snapshot.todayExpenses = parseAmount(root.opt("todayExpenses"));
        snapshot.deepLink = root.optString("deepLink", "/#/");
        return snapshot;
    }

    private static JSONObject requestJson(WidgetStateStore.State state, String path) throws IOException, JSONException {
        HttpURLConnection connection = (HttpURLConnection) new URL(state.apiOrigin + path).openConnection();

        try {
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(10_000);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + state.accessToken);

            int status = connection.getResponseCode();
            if (status == HttpURLConnection.HTTP_UNAUTHORIZED || status == HttpURLConnection.HTTP_FORBIDDEN) {
                throw new WidgetAuthException();
            }

            InputStream stream = status >= 200 && status < 300
                ? connection.getInputStream()
                : connection.getErrorStream();

            String body = readBody(stream);
            if (status < 200 || status >= 300) {
                throw new IOException("Widget endpoint failed with status " + status + ": " + body);
            }

            return new JSONObject(body);
        } finally {
            connection.disconnect();
        }
    }

    private static void parseEvents(JSONArray eventsJson, java.util.List<WidgetModels.CalendarEvent> target) {
        if (eventsJson == null) return;

        for (int i = 0; i < eventsJson.length(); i++) {
            JSONObject eventJson = eventsJson.optJSONObject(i);
            if (eventJson == null) continue;

            WidgetModels.CalendarEvent event = new WidgetModels.CalendarEvent();
            event.title = eventJson.optString("title", "");
            event.startUtc = parseDateTime(eventJson.optString("startUtc", ""));
            event.endUtc = parseDateTime(eventJson.optString("endUtc", ""));
            event.isAllDay = eventJson.optBoolean("isAllDay");
            event.colorHex = emptyToNull(eventJson.optString("colorHex", null));
            target.add(event);
        }
    }

    private static OffsetDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) return null;

        try {
            return OffsetDateTime.parse(raw);
        } catch (Exception ignored) {
        }

        try {
            return LocalDateTime.parse(raw).atOffset(ZoneOffset.UTC);
        } catch (Exception ignored) {
        }

        return null;
    }

    private static BigDecimal parseAmount(Object value) {
        if (value == null || value == JSONObject.NULL) return BigDecimal.ZERO;
        return new BigDecimal(String.valueOf(value));
    }

    private static String emptyToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String readBody(InputStream stream) throws IOException {
        if (stream == null) return "";

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
            return builder.toString();
        }
    }

    static final class WidgetAuthException extends IOException {
    }
}
