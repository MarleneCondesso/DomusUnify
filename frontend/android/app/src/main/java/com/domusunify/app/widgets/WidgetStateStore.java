package com.domusunify.app.widgets;

import android.content.Context;
import android.content.SharedPreferences;

final class WidgetStateStore {
    private static final String PREFS_NAME = "domusunify_widget_state";
    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_FAMILY_ID = "family_id";
    private static final String KEY_API_ORIGIN = "api_origin";

    private WidgetStateStore() {
    }

    static State load(Context context) {
        SharedPreferences prefs = prefs(context);
        return new State(
            normalize(prefs.getString(KEY_ACCESS_TOKEN, null)),
            normalize(prefs.getString(KEY_FAMILY_ID, null)),
            normalizeApiOrigin(prefs.getString(KEY_API_ORIGIN, null))
        );
    }

    static void merge(
        Context context,
        boolean hasAccessToken,
        String accessToken,
        boolean hasFamilyId,
        String familyId,
        boolean hasApiOrigin,
        String apiOrigin
    ) {
        SharedPreferences.Editor editor = prefs(context).edit();
        if (hasAccessToken) putOrRemove(editor, KEY_ACCESS_TOKEN, normalize(accessToken));
        if (hasFamilyId) putOrRemove(editor, KEY_FAMILY_ID, normalize(familyId));
        if (hasApiOrigin) putOrRemove(editor, KEY_API_ORIGIN, normalizeApiOrigin(apiOrigin));
        editor.apply();
    }

    static void clear(Context context) {
        prefs(context).edit().clear().apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static void putOrRemove(SharedPreferences.Editor editor, String key, String value) {
        if (value == null || value.isBlank()) {
            editor.remove(key);
        } else {
            editor.putString(key, value);
        }
    }

    private static String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String normalizeApiOrigin(String value) {
        String normalized = normalize(value);
        if (normalized == null) return null;
        return normalized.replaceAll("/+$", "");
    }

    static final class State {
        final String accessToken;
        final String familyId;
        final String apiOrigin;

        State(String accessToken, String familyId, String apiOrigin) {
            this.accessToken = accessToken;
            this.familyId = familyId;
            this.apiOrigin = apiOrigin;
        }

        boolean isReady() {
            return accessToken != null && !accessToken.isBlank() && apiOrigin != null && !apiOrigin.isBlank();
        }
    }
}
