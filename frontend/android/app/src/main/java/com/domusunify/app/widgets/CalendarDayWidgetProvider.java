package com.domusunify.app.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

public class CalendarDayWidgetProvider extends AppWidgetProvider {
    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        WidgetRefreshScheduler.ensurePeriodic(context);
        WidgetRefreshScheduler.scheduleImmediate(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);
        WidgetRefreshScheduler.ensurePeriodic(context);
        WidgetRefreshScheduler.scheduleImmediate(context);
    }
}
