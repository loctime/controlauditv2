import React, { useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/context/AuthContext';
import AnnualPlansPage from '../../screens/AnnualPlansPage';
import PlanDetailDrawer from '../plans/PlanDetailDrawer';
import PlanEditDialog from '../plans/PlanEditDialog';

export default function AnnualPlansScreenAdapter() {
  const navigate = useNavigate();
  const { userEmpresas = [], userSucursales = [] } = useAuth();

  const [viewPlan, setViewPlan] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const refreshPlansRef = useRef(null);

  const handleCloseView = () => setViewPlan(null);
  const handleCloseEdit = () => setEditPlan(null);

  const handleSaved = () => {
    refreshPlansRef.current?.();
  };

  return (
    <>
      <Box sx={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
        <Box sx={{ flex: 1, minWidth: 0, transition: 'flex 0.25s ease' }}>
          <AnnualPlansPage
            onRegisterRefresh={(fn) => {
              refreshPlansRef.current = fn;
            }}
            onCreatePlan={() => setEditPlan({})}
            onViewPlan={(plan) => setViewPlan(plan)}
            onEditPlan={(plan) => {
              setViewPlan(null);
              setEditPlan(plan);
            }}
            onOpenPlanItems={(plan) => navigate(`/training/plans/${plan.id}`)}
          />
        </Box>

        {viewPlan && (
          <PlanDetailDrawer
            variant="inline"
            plan={viewPlan}
            open={true}
            onClose={handleCloseView}
            onSaved={handleSaved}
            onOpenPlanItems={(p) => navigate(`/training/plans/${p.id}`)}
            companies={userEmpresas}
            branches={userSucursales}
          />
        )}
      </Box>

      <PlanEditDialog
        plan={editPlan}
        open={editPlan !== null}
        onClose={handleCloseEdit}
        onSaved={handleSaved}
        companies={userEmpresas}
        branches={userSucursales}
      />
    </>
  );
}
