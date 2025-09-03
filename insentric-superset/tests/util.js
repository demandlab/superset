import { Page } from 'k6/browser';

/**
 * Navigates through all tabs and children tabs in a given Superset Dashboard.
 * @param {Page} page 
 */
export async function navigateTabs(page) {
    
    const result = await page.evaluate(() => {
        // Persistent state
        if (!window.visitedTabs) { 
            window.visitedTabs = new Set()
        };
        
        function getTabId(tab) {
            return tab.textContent.trim() + '|' + tab.getAttribute('id');
        }
        
        function findNextTab() {
            
            // Check if there are any child tags
            const childTabs = document.querySelectorAll('.ant-tabs-tabpane-active [role="tab"]');
            const unvisitedChild = Array.from(childTabs).find(tab => 
                !window.visitedTabs.has(getTabId(tab))
            );
            
            if (unvisitedChild) return { tab: unvisitedChild, type: 'child' };
            
            // If no child tag left, go to the next top-level tab
            const topLevelTabs = document.querySelectorAll('.ant-tabs:not(.ant-tabs-content .ant-tabs) [role="tab"]');
            const unvisitedTopLevel = Array.from(topLevelTabs).find(tab => 
                !window.visitedTabs.has(getTabId(tab))
            );
            
            if (unvisitedTopLevel) return { tab: unvisitedTopLevel, type: 'top-level' };
            
            return null;
        }
        
        const next = findNextTab();
        
        if (next) {
            const tabId = getTabId(next.tab);
            const tabName = next.tab.textContent.trim();
            
            window.visitedTabs.add(tabId);
            next.tab.click();
            
            return { 
                hasMore: true, 
                tabName, 
                type: next.type,
                totalVisited: window.visitedTabs.size
            };
        }
        
        return { hasMore: false, totalVisited: window.visitedTabs.size };
    });
    
    await page.waitForFunction(() => {
            return document.querySelector('.loading') === null;
    });

    if (result.hasMore) {
        return await navigateTabs(page);
    } else {
        return result.totalVisited;
    }
}