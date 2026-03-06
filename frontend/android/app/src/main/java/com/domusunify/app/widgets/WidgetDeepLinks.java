package com.domusunify.app.widgets;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import com.domusunify.app.MainActivity;
import com.domusunify.app.R;

final class WidgetDeepLinks {
    private WidgetDeepLinks() {
    }

    static PendingIntent openApp(Context context, String target, int requestCode) {
        Uri uri = new Uri.Builder()
            .scheme(context.getString(R.string.custom_url_scheme))
            .authority("app")
            .appendPath("open")
            .appendQueryParameter("target", normalizeTarget(target))
            .build();

        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(uri);
        intent.addCategory(Intent.CATEGORY_DEFAULT);
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);

        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static String normalizeTarget(String target) {
        if (target == null || target.isBlank()) return "/#/";
        String trimmed = target.trim();
        if (trimmed.startsWith("#/")) return "/" + trimmed;
        if (trimmed.startsWith("/")) return trimmed;
        return "/" + trimmed;
    }
}
