import { useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import WorkspacePanel from './components/WorkspacePanel/WorkspacePanel';
import PalettePanel from './components/PalettePanel/PalettePanel';
import NumberPanel from './components/NumberPanel/NumberPanel';
import styles from './App.module.css';

export default function App() {
  const workspaceRef = useRef(null);
  const [activeItem, setActiveItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragStart({ active }) {
    setActiveItem(active.data.current ?? null);
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null);
    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;
    if (!dragData || !dropData) return;

    const { stepId, slot, accepts } = dropData;

    if (dragData.type === 'unit' && accepts === 'unit') {
      workspaceRef.current?.handleSlotDrop(stepId, slot, dragData.unit);
    }

    if (dragData.type === 'conversionFactor' && accepts === 'conversionFactor') {
      workspaceRef.current?.handleLabelDrop(stepId, slot, dragData.conversionFactor);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.layout}>
        <header className={styles.header}>
          <span className={styles.appName}>Conversions</span>
          <span className={styles.subtitle}>Dimensional Analysis Builder</span>
        </header>

        <main className={styles.main}>
          <WorkspacePanel ref={workspaceRef} />
          <PalettePanel />
        </main>

        <footer className={styles.footer}>
          <NumberPanel />
        </footer>
      </div>

      <DragOverlay>
        {activeItem?.type === 'unit' && (
          <div
            style={{
              backgroundColor: activeItem.unit.color,
              padding: '7px 16px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 14,
              color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              cursor: 'grabbing',
            }}
          >
            {activeItem.unit.label}
          </div>
        )}
        {activeItem?.type === 'conversionFactor' && (
          <div
            style={{
              background: `linear-gradient(135deg, ${activeItem.conversionFactor.colorA}, ${activeItem.conversionFactor.colorB})`,
              padding: '7px 14px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              cursor: 'grabbing',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {activeItem.conversionFactor.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
