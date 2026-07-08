// ============================================================
// REAL-TIME SYNC (Polling)
// ============================================================
async function syncData() {
    if (sessionStorage.getItem('arf_session_active') === 'true') {
        try {
            const newInventory = await getAllFromStore('inventory');
            const newLogs = await getAllFromStore('activity_log');
            const newUsers = await getAllFromStore('users');
            const newMaintenance = await getAllFromStore('services');

            // Sort logs
            newLogs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            let inventoryChanged = false;
            if (JSON.stringify(inventory) !== JSON.stringify(newInventory)) {
                inventory = newInventory;
                inventoryChanged = true;
            }

            if (activityLog.length !== newLogs.length || (newLogs.length > 0 && activityLog.length > 0 && activityLog[0].id !== newLogs[0].id)) {
                activityLog = newLogs;
                updateActivityLog();
            }

            if (JSON.stringify(userList) !== JSON.stringify(newUsers)) {
                userList = newUsers;
                const activeUser = sessionStorage.getItem('arf_active_user') || 'Admin';
                if (activeUser.toLowerCase() === 'admin') {
                    renderUsersList();
                }
            }

            if (inventoryChanged) {
                updateDashboard();
                updateChart();
                renderSvcItemDropdown();
            }

            if (JSON.stringify(maintenanceList) !== JSON.stringify(newMaintenance)) {
                maintenanceList = newMaintenance;
                renderServicesTable();
            }
        } catch (e) {
            // fail silently on network issues during polling
        }
    }
}

// Start polling every 3 seconds for real-time feel
setInterval(syncData, 3000);

