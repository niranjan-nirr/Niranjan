// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createSlice } from "@reduxjs/toolkit";

export const compilerConfigurationViewSlice = createSlice({
  name: "compilerConfig",
  initialState: {
    ui: {
      availableComplianceLevels: [] as string[],
    },
    data: {
      useRelease: [] as boolean[],
      enablePreview: [] as boolean[],
      complianceLevel: [] as string[],
      sourceLevel: [] as string[],
      targetLevel: [] as string[],
      generateDebugInfo: [] as boolean[],
      storeMethodParamNames: [] as boolean[],
    },
  },
  reducers: {
    initializeCompilerData: (state, action) => {
      const projectNum = action.payload.projectsNum;
      state.data.useRelease = Array(projectNum).fill(false);
      state.data.enablePreview = Array(projectNum).fill(false);
      state.data.complianceLevel = Array(projectNum).fill("");
      state.data.sourceLevel = Array(projectNum).fill("");
      state.data.targetLevel = Array(projectNum).fill("");
      state.data.generateDebugInfo = Array(projectNum).fill(false);
      state.data.storeMethodParamNames = Array(projectNum).fill(false);
      state.ui.availableComplianceLevels = [];
    },
    updateAvailableComplianceLevels: (state, action) => {
      state.ui.availableComplianceLevels = action.payload.availableComplianceLevels;
    },
    loadCompilerSettings: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.useRelease[activeProjectIndex] = action.payload.useRelease;
      state.data.enablePreview[activeProjectIndex] = action.payload.enablePreview;
      state.data.complianceLevel[activeProjectIndex] = action.payload.complianceLevel;
      state.data.sourceLevel[activeProjectIndex] = action.payload.sourceLevel;
      state.data.targetLevel[activeProjectIndex] = action.payload.targetLevel;
      state.data.generateDebugInfo[activeProjectIndex] = action.payload.generateDebugInfo;
      state.data.storeMethodParamNames[activeProjectIndex] = action.payload.storeMethodParamNames;
    },
    updateUseRelease: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.useRelease[activeProjectIndex] = action.payload.useRelease;
    },
    updateEnablePreview: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.enablePreview[activeProjectIndex] = action.payload.enablePreview;
    },
    updateComplianceLevel: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.complianceLevel[activeProjectIndex] = action.payload.complianceLevel;
    },
    updateSourceLevel: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.sourceLevel[activeProjectIndex] = action.payload.sourceLevel;
    },
    updateTargetLevel: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.targetLevel[activeProjectIndex] = action.payload.targetLevel;
    },
    updateGenerateDebugInfo: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.generateDebugInfo[activeProjectIndex] = action.payload.generateDebugInfo;
    },
    updateStoreMethodParamNames: (state, action) => {
      const activeProjectIndex = action.payload.activeProjectIndex;
      state.data.storeMethodParamNames[activeProjectIndex] = action.payload.storeMethodParamNames;
    },
  },
});

export const {
  initializeCompilerData,
  updateAvailableComplianceLevels,
  loadCompilerSettings,
  updateUseRelease,
  updateEnablePreview,
  updateComplianceLevel,
  updateSourceLevel,
  updateTargetLevel,
  updateGenerateDebugInfo,
  updateStoreMethodParamNames,
} = compilerConfigurationViewSlice.actions;

export default compilerConfigurationViewSlice.reducer;
