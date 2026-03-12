import React from 'react';
import CatalogScreen from '../../screens/CatalogScreen';

export default function CatalogScreenAdapter({ onNavigateToPlans }) {
  return <CatalogScreen onNavigateToPlans={onNavigateToPlans} />;
}

