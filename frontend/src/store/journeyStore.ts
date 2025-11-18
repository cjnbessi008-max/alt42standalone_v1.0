/**
 * KTM Math Planet - Journey Store (Zustand)
 * Manages the planetary journey state and module progress
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Module, ModuleStatus } from '../types/module';
import { PlanetNumber, PlanetStatus, PlanetProgress } from '../types/planets';

interface JourneyState {
  // Current module being worked on
  currentModule: Module | null;

  // Journey navigation
  currentPlanet: PlanetNumber;
  visitedPlanets: PlanetNumber[];

  // Auto-save
  lastSaved: string | null;
  isDirty: boolean;

  // Actions
  setCurrentModule: (module: Module) => void;
  updateModuleProgress: (planetNumber: PlanetNumber, progress: Partial<PlanetProgress>) => void;
  navigateToPlanet: (planetNumber: PlanetNumber) => void;
  completePlanet: (planetNumber: PlanetNumber, data: Record<string, any>) => void;
  markAsSaved: () => void;
  markAsDirty: () => void;
  resetJourney: () => void;

  // Computed helpers
  canNavigateTo: (planetNumber: PlanetNumber) => boolean;
  getPlanetStatus: (planetNumber: PlanetNumber) => PlanetStatus;
  getOverallProgress: () => number;
}

export const useJourneyStore = create<JourneyState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentModule: null,
        currentPlanet: PlanetNumber.DISCOVERY,
        visitedPlanets: [],
        lastSaved: null,
        isDirty: false,

        // Set current module
        setCurrentModule: (module: Module) => {
          set({
            currentModule: module,
            currentPlanet: module.currentPlanet as PlanetNumber,
            visitedPlanets: Object.keys(module.planetProgress)
              .map(Number)
              .filter(n => module.planetProgress[n].status !== PlanetStatus.LOCKED),
            isDirty: false
          });
        },

        // Update progress for a specific planet
        updateModuleProgress: (planetNumber: PlanetNumber, progress: Partial<PlanetProgress>) => {
          const { currentModule } = get();
          if (!currentModule) return;

          const updatedProgress = {
            ...currentModule.planetProgress[planetNumber],
            ...progress
          };

          set({
            currentModule: {
              ...currentModule,
              planetProgress: {
                ...currentModule.planetProgress,
                [planetNumber]: updatedProgress
              }
            },
            isDirty: true
          });
        },

        // Navigate to a specific planet
        navigateToPlanet: (planetNumber: PlanetNumber) => {
          const { canNavigateTo, visitedPlanets } = get();

          if (!canNavigateTo(planetNumber)) {
            console.warn(`Cannot navigate to planet ${planetNumber}: locked`);
            return;
          }

          set((state) => ({
            currentPlanet: planetNumber,
            visitedPlanets: visitedPlanets.includes(planetNumber)
              ? visitedPlanets
              : [...visitedPlanets, planetNumber]
          }));
        },

        // Complete a planet
        completePlanet: (planetNumber: PlanetNumber, data: Record<string, any>) => {
          const { currentModule, updateModuleProgress } = get();
          if (!currentModule) return;

          // Update current planet to completed
          updateModuleProgress(planetNumber, {
            status: PlanetStatus.COMPLETED,
            progress: 100,
            completedAt: new Date().toISOString(),
            data
          });

          // Unlock next planet if exists
          const nextPlanet = planetNumber + 1;
          if (nextPlanet <= PlanetNumber.LAUNCH) {
            updateModuleProgress(nextPlanet as PlanetNumber, {
              status: PlanetStatus.ACTIVE,
              progress: 0
            });
          }

          // Auto-navigate to next planet
          if (nextPlanet <= PlanetNumber.LAUNCH) {
            get().navigateToPlanet(nextPlanet as PlanetNumber);
          }
        },

        // Mark as saved
        markAsSaved: () => {
          set({
            lastSaved: new Date().toISOString(),
            isDirty: false
          });
        },

        // Mark as dirty (needs save)
        markAsDirty: () => {
          set({ isDirty: true });
        },

        // Reset journey
        resetJourney: () => {
          set({
            currentModule: null,
            currentPlanet: PlanetNumber.DISCOVERY,
            visitedPlanets: [],
            lastSaved: null,
            isDirty: false
          });
        },

        // Can navigate to planet?
        canNavigateTo: (planetNumber: PlanetNumber): boolean => {
          const { currentModule } = get();
          if (!currentModule) return false;

          const planetProgress = currentModule.planetProgress[planetNumber];
          if (!planetProgress) return false;

          return planetProgress.status !== PlanetStatus.LOCKED;
        },

        // Get planet status
        getPlanetStatus: (planetNumber: PlanetNumber): PlanetStatus => {
          const { currentModule, currentPlanet } = get();
          if (!currentModule) return PlanetStatus.LOCKED;

          const planetProgress = currentModule.planetProgress[planetNumber];
          if (!planetProgress) return PlanetStatus.LOCKED;

          if (planetProgress.status === PlanetStatus.COMPLETED) {
            return PlanetStatus.COMPLETED;
          }

          if (planetNumber === currentPlanet) {
            return PlanetStatus.ACTIVE;
          }

          return planetProgress.status;
        },

        // Get overall progress
        getOverallProgress: (): number => {
          const { currentModule } = get();
          if (!currentModule) return 0;

          const totalPlanets = 6;
          const completedPlanets = Object.values(currentModule.planetProgress).filter(
            p => p.status === PlanetStatus.COMPLETED
          ).length;

          const currentPlanetProgress = currentModule.planetProgress[get().currentPlanet]?.progress || 0;

          return Math.round(
            ((completedPlanets * 100 + currentPlanetProgress) / totalPlanets)
          );
        }
      }),
      {
        name: 'ktm-journey-storage',
        partialize: (state) => ({
          currentModule: state.currentModule,
          currentPlanet: state.currentPlanet,
          visitedPlanets: state.visitedPlanets,
          lastSaved: state.lastSaved
        })
      }
    )
  )
);
