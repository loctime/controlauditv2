import React from 'react';
import AnnualPlansPage from '../../screens/AnnualPlansPage';

export default function AnnualPlansScreenAdapter() {
  return (
    <AnnualPlansPage
      onCreatePlan={() => {
        // TODO: abrir modal o navegación para crear plan
      }}
      onViewPlan={(plan) => {
        // TODO: navegar a vista de detalle del plan
      }}
      onEditPlan={(plan) => {
        // TODO: abrir modal de edición del plan
      }}
      onOpenPlanItems={(plan) => {
        // TODO: navegar a ítems del plan
      }}
    />
  );
}

