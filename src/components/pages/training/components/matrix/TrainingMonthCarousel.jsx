import { useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';

/**
 * Carousel para mostrar capacitaciones cuando hay >3 por mes
 * Renderiza como contenedor flex con scroll, no como tabla
 * Los TableCell que envuelven esto manejan la estructura de tabla
 */
export default function TrainingMonthCarousel({
  trainings,
  month,
  renderCell,
  onAddToMonth
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CELL_WIDTH = 90;
  const SCROLL_AMOUNT = CELL_WIDTH;

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5
    );
  };

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft =
      direction === 'left'
        ? container.scrollLeft - SCROLL_AMOUNT
        : container.scrollLeft + SCROLL_AMOUNT;

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });

    setTimeout(checkScroll, 300);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        width: '100%',
        height: 36
      }}
    >
      {/* Left arrow */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconButton
          size="small"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          sx={{
            p: 0.5,
            minWidth: 32,
            minHeight: 36
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Scrollable container - renders content divs, not TableCell */}
      <Box
        ref={scrollContainerRef}
        onScroll={checkScroll}
        sx={{
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          flex: 1,
          scrollBehavior: 'smooth'
        }}
      >
        {trainings.map((col) => (
          <Box
            key={col.planItemId}
            sx={{
              width: 90,
              minWidth: 90,
              maxWidth: 90,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: '1px solid #e8e8e8',
              bgcolor: 'white',
              flexShrink: 0,
              p: 0
            }}
          >
            {renderCell(col)}
          </Box>
        ))}

        {/* Add button */}
        <Box
          key={`add-${month}`}
          sx={{
            width: 36,
            minWidth: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid #e8e8e8',
            bgcolor: '#fafafa',
            flexShrink: 0,
            p: 0
          }}
        >
          <Tooltip title="Agregar capacitación a este mes">
            <IconButton
              size="small"
              onClick={() => onAddToMonth(month)}
              sx={{ color: '#42a5f5', p: 0.5 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Right arrow */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconButton
          size="small"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          sx={{
            p: 0.5,
            minWidth: 32,
            minHeight: 36
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
