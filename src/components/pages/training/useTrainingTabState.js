import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Tab default cuando no coincide con un tab permitido (evita mostrar un "Tablero"
// que puede no existir si el tab se quitó).
const DEFAULT_TAB = 'reports';
// matrix oculto temporalmente; section=matrix se trata como catalog
const CONFIG_SECTIONS = ['catalog', 'plans'];

export default function useTrainingTabState(tabs = [], canViewConfiguration = false) {
  const [searchParams, setSearchParams] = useSearchParams();

  const allowedTabs = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const rawTab = searchParams.get('tab');
  const rawSection = searchParams.get('section');

  // Redirect legacy tab=history to tab=people (History merged into People)
  const effectiveTab = rawTab === 'history' ? 'people' : rawTab;
  const normalizedTab = allowedTabs.includes(effectiveTab) ? effectiveTab : DEFAULT_TAB;
  const activeTab = !canViewConfiguration && normalizedTab === 'configuration' ? DEFAULT_TAB : normalizedTab;

  const activeSection = activeTab === 'configuration' && CONFIG_SECTIONS.includes(rawSection)
    ? rawSection
    : 'catalog';

  // Replace URL when landing on legacy tab=history so address bar shows tab=people
  useEffect(() => {
    if (rawTab !== 'history') return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'people');
    setSearchParams(next, { replace: true });
  }, [rawTab, searchParams, setSearchParams]);

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

