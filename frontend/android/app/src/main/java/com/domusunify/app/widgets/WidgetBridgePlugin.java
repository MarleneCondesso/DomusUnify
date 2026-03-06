package com.domusunify.app.widgets;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void syncState(PluginCall call) {
        JSObject data = call.getData();
        WidgetStateStore.merge(
            getContext(),
            data.has("accessToken"),
            call.getString("accessToken"),
            data.has("familyId"),
            call.getString("familyId"),
            data.has("apiOrigin"),
            call.getString("apiOrigin")
        );

        WidgetRefreshScheduler.ensurePeriodic(getContext());
        WidgetRefreshScheduler.scheduleImmediate(getContext());
        call.resolve();
    }

    @PluginMethod
    public void clearState(PluginCall call) {
        WidgetStateStore.clear(getContext());
        WidgetRefreshScheduler.scheduleImmediate(getContext());
        call.resolve();
    }

    @PluginMethod
    public void refreshWidgets(PluginCall call) {
        WidgetRefreshScheduler.ensurePeriodic(getContext());
        WidgetRefreshScheduler.scheduleImmediate(getContext());
        call.resolve();
    }
}
