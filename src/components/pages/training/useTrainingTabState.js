import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_TAB = 'dashboard';
// matrix oculto temporalmente; section=matrix se trata como catalog
const CONFIG_SECTIONS = ['catalog', 'plans'];

export default function useTrainingTabState(tabs = [], canViewConfiguration = false) {
  const [searchParams, setSearchParams] = useSearchParams();

  const allowedTabs = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const rawTab = searchParams.get('tab');
  const rawSection = searchParams.get('section');

  const normalizedTab = allowedTabs.includes(rawTab) ? rawTab : DEFAULT_TAB;
  const activeTab = !canViewConfiguration && normalizedTab === 'configuration' ? DEFAULT_TAB : normalizedTab;

  const activeSection = activeTab === 'configuration' && CONFIG_SECTIONS.includes(rawSection)
    ? rawSection
    : 'catalog';

  const setTab = (tabId) => {
    const nextTab = allowedTabs.includes(tabId) ? tabId : DEFAULT_TAB;
    const safeTab = !canViewConfiguration && nextTab === 'configuration' ? DEFAULT_TAB : nextTab;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', safeTab);

    if (safeTab !== 'configuration') {
      nextParams.delete('section');
    } else if (!CONFIG_SECTIONS.includes(nextParams.get('section'))) {
      nextParams.set('section', 'catalog');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const setSection = (sectionId) => {
    if (!CONFIG_SECTIONS.includes(sectionId)) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', canViewConfiguration ? 'configuration' : DEFAULT_TAB);
    if (canViewConfiguration) {
      nextParams.set('section', sectionId);
    } else {
      nextParams.delete('section');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const navigateToPlans = (trainingTypeId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', canViewConfiguration ? 'configuration' : DEFAULT_TAB);
    nextParams.set('section', 'plans');
    if (trainingTypeId) {
      nextParams.set('trainingTypeId', trainingTypeId);
    } else {
      nextParams.delete('trainingTypeId');
    }
    setSearchParams(nextParams, { replace: true });
  };

  return {
    activeTab,
    activeSection,
    setTab,
    setSection,
    navigateToPlans
  };
}

