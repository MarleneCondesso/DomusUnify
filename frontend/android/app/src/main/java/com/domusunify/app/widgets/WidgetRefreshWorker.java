package com.domusunify.app.widgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class WidgetRefreshWorker extends Worker {
    private static final String TAG = "DomusWidgets";

    public WidgetRefreshWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] weekWidgetIds = manager.getAppWidgetIds(new ComponentName(context, CalendarWeekWidgetProvider.class));
        int[] dayWidgetIds = manager.getAppWidgetIds(new ComponentName(context, CalendarDayWidgetProvider.class));
        int[] budgetWidgetIds = manager.getAppWidgetIds(new ComponentName(context, BudgetSummaryWidgetProvider.class));

        if (weekWidgetIds.length == 0 && dayWidgetIds.length == 0 && budgetWidgetIds.length == 0) {
            return Result.success();
        }

        WidgetStateStore.State state = WidgetStateStore.load(context);
        WidgetModels.CalendarSnapshot calendarSnapshot = null;
        WidgetModels.BudgetSnapshot budgetSnapshot = null;

        if (state.isReady()) {
            if (weekWidgetIds.length > 0 || dayWidgetIds.length > 0) {
                try {
                    calendarSnapshot = WidgetDataClient.fetchCalendarSnapshot(state);
                } catch (WidgetDataClient.WidgetAuthException authException) {
                    Log.w(TAG, "Calendar widget unauthorized.");
                } catch (Exception ex) {
                    Log.w(TAG, "Calendar widget refresh failed.", ex);
                }
            }

            if (budgetWidgetIds.length > 0) {
                try {
                    budgetSnapshot = WidgetDataClient.fetchBudgetSnapshot(state);
                } catch (WidgetDataClient.WidgetAuthException authException) {
                    Log.w(TAG, "Budget widget unauthorized.");
                } catch (Exception ex) {
                    Log.w(TAG, "Budget widget refresh failed.", ex);
                }
            }
        }

        WidgetRenderers.renderCalendarWeek(context, manager, weekWidgetIds, state, calendarSnapshot);
        WidgetRenderers.renderCalendarDay(context, manager, dayWidgetIds, state, calendarSnapshot);
        WidgetRenderers.renderBudget(context, manager, budgetWidgetIds, state, budgetSnapshot);
        WidgetRefreshScheduler.ensurePeriodic(context);
        return Result.success();
    }
}
