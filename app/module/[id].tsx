import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, ScrollView, Text, View, useColorScheme } from 'react-native';
import { DiagramView } from '../../src/presentation/DiagramView';
import { ControlRailView } from '../../src/presentation/ControlRailView';
import { ReadoutGridView } from '../../src/presentation/ReadoutGridView';
import { TrendsView } from '../../src/presentation/TrendsView';
import { ScenarioBar } from '../../src/presentation/ScenarioBar';
import type { ModulePresentation, PresentationContext } from '../../src/presentation/types';
import { PracticePanel } from '../../src/presentation/PracticePanel';
import { useNativeEngineLoop, type NativeLoopConfig } from '../../src/hooks/useNativeEngineLoop';

import { glucoseNativeLoopConfig } from '../../src/engine/glucose/nativeLoopConfig';
import { buildGlucosePresentation } from '../../src/engine/glucose/presentation';
import {
  DEFAULT_GLUCOSE_INPUTS,
  GLUCOSE_PRESETS,
  GLUCOSE_PRESET_LABELS,
  PRESET_ORDER as GLUCOSE_PRESET_ORDER,
} from '../../src/engine/glucose/presets';
import { perturbEatMeal, perturbGiveInsulin } from '../../src/engine/glucose/engine';
import { GLUCOSE_QUESTIONS } from '../../src/engine/glucose/questions';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from '../../src/engine/glucose/types';

import { cardiorenalNativeLoopConfig } from '../../src/engine/cardiorenal/nativeLoopConfig';
import { buildCardiorenalPresentation } from '../../src/engine/cardiorenal/presentation';
import {
  DEFAULT_INPUTS as CARDIORENAL_DEFAULTS,
  PRESETS as CARDIORENAL_PRESETS,
  PRESET_LABELS as CARDIORENAL_PRESET_LABELS,
  PRESET_ORDER as CARDIORENAL_PRESET_ORDER,
} from '../../src/engine/cardiorenal/presets';
import { perturbBloodVolume } from '../../src/engine/cardiorenal/engine';
import { CARDIORENAL_QUESTIONS } from '../../src/engine/cardiorenal/questions';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from '../../src/engine/cardiorenal/types';

import { respiratoryNativeLoopConfig } from '../../src/engine/respiratory/nativeLoopConfig';
import { buildRespiratoryPresentation } from '../../src/engine/respiratory/presentation';
import {
  DEFAULT_RESP_INPUTS,
  RESP_PRESETS,
  RESP_PRESET_LABELS,
  PRESET_ORDER as RESP_PRESET_ORDER,
} from '../../src/engine/respiratory/presets';
import { perturbAirwayObstruction } from '../../src/engine/respiratory/engine';
import { RESPIRATORY_QUESTIONS } from '../../src/engine/respiratory/questions';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from '../../src/engine/respiratory/types';


import { adrenalCortexNativeLoopConfig } from '../../src/engine/adrenalCortex/nativeLoopConfig';
import { buildAdrenalCortexPresentation } from '../../src/engine/adrenalCortex/presentation';
import {
  DEFAULT_ADRENAL_INPUTS,
  ADRENAL_PRESETS,
  ADRENAL_PRESET_LABELS,
  ADRENAL_PRESET_ORDER,
} from '../../src/engine/adrenalCortex/presets';
import { ADRENAL_QUESTIONS } from '../../src/engine/adrenalCortex/questions';
import type { AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint } from '../../src/engine/adrenalCortex/types';

import { adrenalMedullaNativeLoopConfig } from '../../src/engine/adrenalMedulla/nativeLoopConfig';
import { buildAdrenalMedullaPresentation } from '../../src/engine/adrenalMedulla/presentation';
import {
  DEFAULT_MEDULLA_INPUTS,
  MEDULLA_PRESETS,
  MEDULLA_PRESET_LABELS,
  MEDULLA_PRESET_ORDER,
} from '../../src/engine/adrenalMedulla/presets';
import { perturbParoxysm as perturbParoxysm } from '../../src/engine/adrenalMedulla/engine';
import { MEDULLA_QUESTIONS } from '../../src/engine/adrenalMedulla/questions';
import type { MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint } from '../../src/engine/adrenalMedulla/types';

import { anteriorPituitaryNativeLoopConfig } from '../../src/engine/anteriorPituitary/nativeLoopConfig';
import { buildAnteriorPituitaryPresentation } from '../../src/engine/anteriorPituitary/presentation';
import {
  DEFAULT_PITUITARY_INPUTS,
  PITUITARY_PRESETS,
  PITUITARY_PRESET_LABELS,
  PITUITARY_PRESET_ORDER,
} from '../../src/engine/anteriorPituitary/presets';
import { perturbGlucoseLoad as perturbGlucoseLoad, perturbBromocriptineDose as perturbBromocriptineDose } from '../../src/engine/anteriorPituitary/engine';
import { PITUITARY_QUESTIONS } from '../../src/engine/anteriorPituitary/questions';
import type { PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint } from '../../src/engine/anteriorPituitary/types';

import { hpaAxisNativeLoopConfig } from '../../src/engine/hpaAxis/nativeLoopConfig';
import { buildHpaPresentation } from '../../src/engine/hpaAxis/presentation';
import {
  DEFAULT_HPA_INPUTS,
  HPA_PRESETS,
  HPA_PRESET_LABELS,
  PRESET_ORDER as HPA_PRESET_ORDER,
} from '../../src/engine/hpaAxis/presets';
import { perturbAcuteStressor as perturbAcuteStressor } from '../../src/engine/hpaAxis/engine';
import { HPA_QUESTIONS } from '../../src/engine/hpaAxis/questions';
import type { HpaState, HpaDerived, HpaInputs, HpaHistoryPoint } from '../../src/engine/hpaAxis/types';

import { hpgAxisNativeLoopConfig } from '../../src/engine/hpgAxis/nativeLoopConfig';
import { buildHpgPresentation } from '../../src/engine/hpgAxis/presentation';
import {
  DEFAULT_HPG_INPUTS,
  HPG_PRESETS,
  HPG_PRESET_LABELS,
  PRESET_ORDER as HPG_PRESET_ORDER,
} from '../../src/engine/hpgAxis/presets';
import { HPG_QUESTIONS } from '../../src/engine/hpgAxis/questions';
import type { HpgState, HpgDerived, HpgInputs, HpgHistoryPoint } from '../../src/engine/hpgAxis/types';

import { hptAxisNativeLoopConfig } from '../../src/engine/hptAxis/nativeLoopConfig';
import { buildHptPresentation } from '../../src/engine/hptAxis/presentation';
import {
  DEFAULT_HPT_INPUTS,
  HPT_PRESETS,
  HPT_PRESET_LABELS,
  PRESET_ORDER as HPT_PRESET_ORDER,
} from '../../src/engine/hptAxis/presets';
import { perturbAcuteIllness as perturbAcuteIllness } from '../../src/engine/hptAxis/engine';
import { HPT_QUESTIONS } from '../../src/engine/hptAxis/questions';
import type { HptState, HptDerived, HptInputs, HptHistoryPoint } from '../../src/engine/hptAxis/types';

import { calciumHomeostasisNativeLoopConfig } from '../../src/engine/calciumHomeostasis/nativeLoopConfig';
import { buildCalciumHomeostasisPresentation } from '../../src/engine/calciumHomeostasis/presentation';
import {
  DEFAULT_CALCIUM_INPUTS,
  CALCIUM_PRESETS,
  CALCIUM_PRESET_LABELS,
  PRESET_ORDER as CALCIUM_PRESET_ORDER,
} from '../../src/engine/calciumHomeostasis/presets';
import { perturbCalciumInfusion as perturbCalciumInfusion } from '../../src/engine/calciumHomeostasis/engine';
import { CALCIUM_QUESTIONS } from '../../src/engine/calciumHomeostasis/questions';
import type { CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint } from '../../src/engine/calciumHomeostasis/types';

import { cardiacElectroNativeLoopConfig } from '../../src/engine/cardiacElectro/nativeLoopConfig';
import { buildCardiacElectroPresentation } from '../../src/engine/cardiacElectro/presentation';
import {
  DEFAULT_CARDIAC_INPUTS,
  CARDIAC_PRESETS,
  CARDIAC_PRESET_LABELS,
  PRESET_ORDER as CARDIAC_PRESET_ORDER,
} from '../../src/engine/cardiacElectro/presets';
import { CARDIAC_QUESTIONS } from '../../src/engine/cardiacElectro/questions';
import type { CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint } from '../../src/engine/cardiacElectro/types';

import { ecgConductionNativeLoopConfig } from '../../src/engine/ecgConduction/nativeLoopConfig';
import { buildEcgConductionPresentation } from '../../src/engine/ecgConduction/presentation';
import {
  DEFAULT_ECG_INPUTS,
  ECG_PRESETS,
  ECG_PRESET_LABELS,
  PRESET_ORDER as ECG_PRESET_ORDER,
} from '../../src/engine/ecgConduction/presets';
import { ECG_QUESTIONS } from '../../src/engine/ecgConduction/questions';
import type { EcgState, EcgDerived, EcgInputs, EcgHistoryPoint } from '../../src/engine/ecgConduction/types';

import { coronaryCirculationNativeLoopConfig } from '../../src/engine/coronaryCirculation/nativeLoopConfig';
import { buildCoronaryCirculationPresentation } from '../../src/engine/coronaryCirculation/presentation';
import {
  DEFAULT_CORONARY_INPUTS,
  CORONARY_PRESETS,
  CORONARY_PRESET_LABELS,
  CORONARY_PRESET_ORDER,
} from '../../src/engine/coronaryCirculation/presets';
import { perturbExertion as perturbExertion, perturbVasospasm as perturbVasospasm } from '../../src/engine/coronaryCirculation/engine';
import { CORONARY_QUESTIONS } from '../../src/engine/coronaryCirculation/questions';
import type { CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint } from '../../src/engine/coronaryCirculation/types';

import { venousReturnNativeLoopConfig } from '../../src/engine/venousReturn/nativeLoopConfig';
import { buildVenousReturnPresentation } from '../../src/engine/venousReturn/presentation';
import {
  DEFAULT_VENOUS_RETURN_INPUTS,
  VENOUS_RETURN_PRESETS,
  VENOUS_RETURN_PRESET_LABELS,
  VENOUS_RETURN_PRESET_ORDER,
} from '../../src/engine/venousReturn/presets';
import { perturbHemorrhage as perturbHemorrhage, perturbTransfusion as perturbTransfusion, perturbValsalva as perturbValsalva } from '../../src/engine/venousReturn/engine';
import { VENOUS_RETURN_QUESTIONS } from '../../src/engine/venousReturn/questions';
import type { VenousReturnState, VenousReturnDerived, VenousReturnInputs, VenousReturnHistoryPoint } from '../../src/engine/venousReturn/types';

import { respiratoryMechanicsNativeLoopConfig } from '../../src/engine/respiratoryMechanics/nativeLoopConfig';
import { buildRespiratoryMechanicsPresentation } from '../../src/engine/respiratoryMechanics/presentation';
import {
  DEFAULT_RESP_MECH_INPUTS,
  RESP_MECH_PRESETS,
  RESP_MECH_PRESET_LABELS,
  PRESET_ORDER as RESP_MECH_PRESET_ORDER,
} from '../../src/engine/respiratoryMechanics/presets';
import { perturbFvcManeuver as perturbFvcManeuver } from '../../src/engine/respiratoryMechanics/engine';
import { RESP_MECH_QUESTIONS } from '../../src/engine/respiratoryMechanics/questions';
import type { RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint } from '../../src/engine/respiratoryMechanics/types';

import { renalTubularNativeLoopConfig } from '../../src/engine/renalTubular/nativeLoopConfig';
import { buildRenalTubularPresentation } from '../../src/engine/renalTubular/presentation';
import {
  DEFAULT_RENAL_TUBULAR_INPUTS,
  RENAL_TUBULAR_PRESETS,
  RENAL_TUBULAR_PRESET_LABELS,
  PRESET_ORDER as RENAL_TUBULAR_PRESET_ORDER,
} from '../../src/engine/renalTubular/presets';
import { perturbWaterDeprivation as perturbWaterDeprivation } from '../../src/engine/renalTubular/engine';
import { RENAL_TUBULAR_QUESTIONS } from '../../src/engine/renalTubular/questions';
import type { RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint } from '../../src/engine/renalTubular/types';

import { electrolyteBalanceNativeLoopConfig } from '../../src/engine/electrolyteBalance/nativeLoopConfig';
import { buildElectrolyteBalancePresentation } from '../../src/engine/electrolyteBalance/presentation';
import {
  DEFAULT_ELECTROLYTE_INPUTS,
  ELECTROLYTE_PRESETS,
  ELECTROLYTE_PRESET_LABELS,
  ELECTROLYTE_PRESET_ORDER,
} from '../../src/engine/electrolyteBalance/presets';
import { perturbGiveInsulin as perturbElectrolyteGiveInsulin, perturbSalineBolus as perturbSalineBolus, perturbPotassiumBolus as perturbPotassiumBolus } from '../../src/engine/electrolyteBalance/engine';
import { ELECTROLYTE_QUESTIONS } from '../../src/engine/electrolyteBalance/questions';
import type { ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint } from '../../src/engine/electrolyteBalance/types';

import { capillaryExchangeNativeLoopConfig } from '../../src/engine/capillaryExchange/nativeLoopConfig';
import { buildCapillaryExchangePresentation } from '../../src/engine/capillaryExchange/presentation';
import {
  DEFAULT_CAPILLARY_INPUTS,
  CAPILLARY_PRESETS,
  CAPILLARY_PRESET_LABELS,
  CAPILLARY_PRESET_ORDER,
} from '../../src/engine/capillaryExchange/presets';
import { perturbAlbuminInfusion as perturbAlbuminInfusion, perturbStandUp as perturbStandUp } from '../../src/engine/capillaryExchange/engine';
import { CAPILLARY_QUESTIONS } from '../../src/engine/capillaryExchange/questions';
import type { CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint } from '../../src/engine/capillaryExchange/types';

import { gastrointestinalNativeLoopConfig } from '../../src/engine/gastrointestinal/nativeLoopConfig';
import { buildGastrointestinalPresentation } from '../../src/engine/gastrointestinal/presentation';
import {
  DEFAULT_GI_INPUTS,
  GI_PRESETS,
  GI_PRESET_LABELS,
  PRESET_ORDER as GI_PRESET_ORDER,
} from '../../src/engine/gastrointestinal/presets';
import { perturbEatMeal as perturbGI_EatMeal } from '../../src/engine/gastrointestinal/engine';
import { GI_QUESTIONS } from '../../src/engine/gastrointestinal/questions';
import type { GiState, GiDerived, GiInputs, GiHistoryPoint } from '../../src/engine/gastrointestinal/types';

import { digestionAbsorptionNativeLoopConfig } from '../../src/engine/digestionAbsorption/nativeLoopConfig';
import { buildDigestionAbsorptionPresentation } from '../../src/engine/digestionAbsorption/presentation';
import {
  DEFAULT_DIGESTION_INPUTS,
  DIGESTION_PRESETS,
  DIGESTION_PRESET_LABELS,
  DIGESTION_PRESET_ORDER,
} from '../../src/engine/digestionAbsorption/presets';
import { perturbEatMeal as perturbDigest_EatMeal } from '../../src/engine/digestionAbsorption/engine';
import { DIGESTION_QUESTIONS } from '../../src/engine/digestionAbsorption/questions';
import type { DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint } from '../../src/engine/digestionAbsorption/types';

import { enzymeKineticsNativeLoopConfig } from '../../src/engine/enzymeKinetics/nativeLoopConfig';
import { buildEnzymeKineticsPresentation } from '../../src/engine/enzymeKinetics/presentation';
import {
  DEFAULT_KINETICS_INPUTS,
  KINETICS_PRESETS,
  KINETICS_PRESET_LABELS,
  KINETICS_PRESET_ORDER,
} from '../../src/engine/enzymeKinetics/presets';
import { KINETICS_QUESTIONS } from '../../src/engine/enzymeKinetics/questions';
import type { KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint } from '../../src/engine/enzymeKinetics/types';

import { liverPhysiologyNativeLoopConfig } from '../../src/engine/liverPhysiology/nativeLoopConfig';
import { buildLiverPhysiologyPresentation } from '../../src/engine/liverPhysiology/presentation';
import {
  DEFAULT_LIVER_INPUTS,
  LIVER_PRESETS,
  LIVER_PRESET_LABELS,
  LIVER_PRESET_ORDER,
} from '../../src/engine/liverPhysiology/presets';
import { perturbHaemolyticEpisode as perturbHaemolyticEpisode, perturbAlcoholBinge as perturbAlcoholBinge, perturbStentObstruction as perturbStentObstruction } from '../../src/engine/liverPhysiology/engine';
import { LIVER_QUESTIONS } from '../../src/engine/liverPhysiology/questions';
import type { LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint } from '../../src/engine/liverPhysiology/types';

import { bloodGroupsNativeLoopConfig } from '../../src/engine/bloodGroups/nativeLoopConfig';
import { buildBloodGroupsPresentation } from '../../src/engine/bloodGroups/presentation';
import {
  DEFAULT_BLOOD_INPUTS,
  BLOOD_PRESETS,
  BLOOD_PRESET_LABELS,
  BLOOD_PRESET_ORDER,
} from '../../src/engine/bloodGroups/presets';
import { BLOOD_QUESTIONS } from '../../src/engine/bloodGroups/questions';
import type { BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint } from '../../src/engine/bloodGroups/types';

import { coagulationNativeLoopConfig } from '../../src/engine/coagulation/nativeLoopConfig';
import { buildCoagulationPresentation } from '../../src/engine/coagulation/presentation';
import {
  DEFAULT_COAG_INPUTS,
  COAG_PRESETS,
  COAG_PRESET_LABELS,
  PRESET_ORDER as COAG_PRESET_ORDER,
} from '../../src/engine/coagulation/presets';
import { perturbInjury as perturbInjury } from '../../src/engine/coagulation/engine';
import { COAGULATION_QUESTIONS } from '../../src/engine/coagulation/questions';
import type { CoagState, CoagDerived, CoagInputs, CoagHistoryPoint } from '../../src/engine/coagulation/types';

import { erythropoiesisNativeLoopConfig } from '../../src/engine/erythropoiesis/nativeLoopConfig';
import { buildErythropoiesisPresentation } from '../../src/engine/erythropoiesis/presentation';
import {
  DEFAULT_ERYTHRO_INPUTS,
  ERYTHRO_PRESETS,
  ERYTHRO_PRESET_LABELS,
  PRESET_ORDER as ERYTHRO_PRESET_ORDER,
} from '../../src/engine/erythropoiesis/presets';
import { perturbAcuteBloodLoss as perturbAcuteBloodLoss } from '../../src/engine/erythropoiesis/engine';
import { ERYTHROPOIESIS_QUESTIONS } from '../../src/engine/erythropoiesis/questions';
import type { ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint } from '../../src/engine/erythropoiesis/types';

import { shockStatesNativeLoopConfig } from '../../src/engine/shockStates/nativeLoopConfig';
import { buildShockStatesPresentation } from '../../src/engine/shockStates/presentation';
import {
  DEFAULT_SHOCK_INPUTS,
  SHOCK_PRESETS,
  SHOCK_PRESET_LABELS,
  SHOCK_PRESET_ORDER,
} from '../../src/engine/shockStates/presets';
import { perturbHaemorrhage as perturbHaemorrhage, perturbFluidBolus as perturbFluidBolus } from '../../src/engine/shockStates/engine';
import { SHOCK_QUESTIONS } from '../../src/engine/shockStates/questions';
import type { ShockState, ShockDerived, ShockInputs, ShockHistoryPoint } from '../../src/engine/shockStates/types';

import { inflammationNativeLoopConfig } from '../../src/engine/inflammation/nativeLoopConfig';
import { buildInflammationPresentation } from '../../src/engine/inflammation/presentation';
import {
  DEFAULT_INFLAMMATION_INPUTS,
  INFLAMMATION_PRESETS,
  INFLAMMATION_PRESET_LABELS,
  INFLAMMATION_PRESET_ORDER,
} from '../../src/engine/inflammation/presets';
import { perturbNewInsult as perturbNewInsult, perturbDrainAbscess as perturbDrainAbscess } from '../../src/engine/inflammation/engine';
import { INFLAMMATION_QUESTIONS } from '../../src/engine/inflammation/questions';
import type { InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint } from '../../src/engine/inflammation/types';

import { cerebralPerfusionNativeLoopConfig } from '../../src/engine/cerebralPerfusion/nativeLoopConfig';
import { buildCerebralPerfusionPresentation } from '../../src/engine/cerebralPerfusion/presentation';
import {
  DEFAULT_CEREBRAL_INPUTS,
  CEREBRAL_PRESETS,
  CEREBRAL_PRESET_LABELS,
  CEREBRAL_PRESET_ORDER,
} from '../../src/engine/cerebralPerfusion/presets';
import { perturbDrainCsf as perturbDrainCsf, perturbAcuteBleed as perturbAcuteBleed } from '../../src/engine/cerebralPerfusion/engine';
import { CEREBRAL_QUESTIONS } from '../../src/engine/cerebralPerfusion/questions';
import type { CerebralInternalState, CerebralDerived, CerebralInputs, CerebralHistoryPoint } from '../../src/engine/cerebralPerfusion/types';

import { motorControlNativeLoopConfig } from '../../src/engine/motorControl/nativeLoopConfig';
import { buildMotorControlPresentation } from '../../src/engine/motorControl/presentation';
import {
  DEFAULT_MOTOR_INPUTS,
  MOTOR_PRESETS,
  MOTOR_PRESET_LABELS,
  MOTOR_PRESET_ORDER,
} from '../../src/engine/motorControl/presets';
import { perturbLevodopaDose as perturbLevodopaDose, perturbToggleDbs as perturbToggleDbs } from '../../src/engine/motorControl/engine';
import { MOTOR_QUESTIONS } from '../../src/engine/motorControl/questions';
import type { MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint } from '../../src/engine/motorControl/types';

import { somaticSensationNativeLoopConfig } from '../../src/engine/somaticSensation/nativeLoopConfig';
import { buildSomaticSensationPresentation } from '../../src/engine/somaticSensation/presentation';
import {
  DEFAULT_SOMATIC_INPUTS,
  SOMATIC_PRESETS,
  SOMATIC_PRESET_LABELS,
  SOMATIC_PRESET_ORDER,
} from '../../src/engine/somaticSensation/presets';
import { perturbOpioidBolus as perturbOpioidBolus, perturbTissueInjury as perturbTissueInjury } from '../../src/engine/somaticSensation/engine';
import { SOMATIC_QUESTIONS } from '../../src/engine/somaticSensation/questions';
import type { SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint } from '../../src/engine/somaticSensation/types';

import { muscleContractionNativeLoopConfig } from '../../src/engine/muscleContraction/nativeLoopConfig';
import { buildMuscleContractionPresentation } from '../../src/engine/muscleContraction/presentation';
import {
  DEFAULT_MUSCLE_INPUTS,
  MUSCLE_PRESETS,
  MUSCLE_PRESET_LABELS,
  MUSCLE_PRESET_ORDER,
} from '../../src/engine/muscleContraction/presets';
import { perturbStimulate as perturbMuscleStimulate, perturbCaffeine as perturbCaffeine } from '../../src/engine/muscleContraction/engine';
import { MUSCLE_QUESTIONS } from '../../src/engine/muscleContraction/questions';
import type { MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint } from '../../src/engine/muscleContraction/types';

import { neuromuscularJunctionNativeLoopConfig } from '../../src/engine/neuromuscularJunction/nativeLoopConfig';
import { buildNeuromuscularJunctionPresentation } from '../../src/engine/neuromuscularJunction/presentation';
import {
  DEFAULT_NMJ_INPUTS,
  NMJ_PRESETS,
  NMJ_PRESET_LABELS,
  NMJ_PRESET_ORDER,
} from '../../src/engine/neuromuscularJunction/presets';
import { perturbTetanicBurst as perturbTetanicBurst, perturbRest as perturbRest } from '../../src/engine/neuromuscularJunction/engine';
import { NMJ_QUESTIONS } from '../../src/engine/neuromuscularJunction/questions';
import type { NmjState, NmjDerived, NmjInputs, NmjHistoryPoint } from '../../src/engine/neuromuscularJunction/types';

import { hearingNativeLoopConfig } from '../../src/engine/hearing/nativeLoopConfig';
import { buildHearingPresentation } from '../../src/engine/hearing/presentation';
import {
  DEFAULT_HEARING_INPUTS,
  HEARING_PRESETS,
  HEARING_PRESET_LABELS,
  HEARING_PRESET_ORDER,
} from '../../src/engine/hearing/presets';
import { perturbNoiseExposure as perturbNoiseExposure } from '../../src/engine/hearing/engine';
import { HEARING_QUESTIONS } from '../../src/engine/hearing/questions';
import type { HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint } from '../../src/engine/hearing/types';

import { vestibularNativeLoopConfig } from '../../src/engine/vestibular/nativeLoopConfig';
import { buildVestibularPresentation } from '../../src/engine/vestibular/presentation';
import {
  DEFAULT_VESTIBULAR_INPUTS,
  VESTIBULAR_PRESETS,
  VESTIBULAR_PRESET_LABELS,
  VESTIBULAR_PRESET_ORDER,
} from '../../src/engine/vestibular/presets';
import { perturbPerformHallpike as perturbPerformHallpike, perturbHeadImpulse as perturbHeadImpulse } from '../../src/engine/vestibular/engine';
import { VESTIBULAR_QUESTIONS } from '../../src/engine/vestibular/questions';
import type { VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint } from '../../src/engine/vestibular/types';

import { visionNativeLoopConfig } from '../../src/engine/vision/nativeLoopConfig';
import { buildVisionPresentation } from '../../src/engine/vision/presentation';
import {
  DEFAULT_VISION_INPUTS,
  VISION_PRESETS,
  VISION_PRESET_LABELS,
  VISION_PRESET_ORDER,
} from '../../src/engine/vision/presets';
import { perturbLightsOut as perturbLightsOut, perturbBrightGlare as perturbBrightGlare, perturbShineTorch as perturbShineTorch, perturbTorchOff as perturbTorchOff } from '../../src/engine/vision/engine';
import { VISION_QUESTIONS } from '../../src/engine/vision/questions';
import type { VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint } from '../../src/engine/vision/types';

import { cellCycleNativeLoopConfig } from '../../src/engine/cellCycle/nativeLoopConfig';
import { buildCellCyclePresentation } from '../../src/engine/cellCycle/presentation';
import {
  DEFAULT_CELL_CYCLE_INPUTS,
  CELL_CYCLE_PRESETS,
  CELL_CYCLE_PRESET_LABELS,
  CELL_CYCLE_PRESET_ORDER,
} from '../../src/engine/cellCycle/presets';
import { CELL_CYCLE_QUESTIONS } from '../../src/engine/cellCycle/questions';
import type { CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint } from '../../src/engine/cellCycle/types';

import { micturitionNativeLoopConfig } from '../../src/engine/micturition/nativeLoopConfig';
import { buildMicturitionPresentation } from '../../src/engine/micturition/presentation';
import {
  DEFAULT_MICTURITION_INPUTS,
  MICTURITION_PRESETS,
  MICTURITION_PRESET_LABELS,
  MICTURITION_PRESET_ORDER,
} from '../../src/engine/micturition/presets';
import { MICTURITION_QUESTIONS } from '../../src/engine/micturition/questions';
import type { MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint } from '../../src/engine/micturition/types';

import { pregnancyNativeLoopConfig } from '../../src/engine/pregnancy/nativeLoopConfig';
import { buildPregnancyPresentation } from '../../src/engine/pregnancy/presentation';
import {
  DEFAULT_PREGNANCY_INPUTS,
  PREGNANCY_PRESETS,
  PREGNANCY_PRESET_LABELS,
  PREGNANCY_PRESET_ORDER,
} from '../../src/engine/pregnancy/presets';
import { perturbStartLabour as perturbStartLabour, perturbFeedNow as perturbFeedNow } from '../../src/engine/pregnancy/engine';
import { PREGNANCY_QUESTIONS } from '../../src/engine/pregnancy/questions';
import type { PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint } from '../../src/engine/pregnancy/types';

import { exercisePhysiologyNativeLoopConfig } from '../../src/engine/exercisePhysiology/nativeLoopConfig';
import { buildExercisePhysiologyPresentation } from '../../src/engine/exercisePhysiology/presentation';
import {
  DEFAULT_EXERCISE_INPUTS,
  EXERCISE_PRESETS,
  EXERCISE_PRESET_LABELS,
  EXERCISE_PRESET_ORDER,
} from '../../src/engine/exercisePhysiology/presets';
import { perturbSprintSurge as perturbSprintSurge } from '../../src/engine/exercisePhysiology/engine';
import { EXERCISE_QUESTIONS } from '../../src/engine/exercisePhysiology/questions';
import type { ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint } from '../../src/engine/exercisePhysiology/types';

import { fetalCirculationNativeLoopConfig } from '../../src/engine/fetalCirculation/nativeLoopConfig';
import { buildFetalCirculationPresentation } from '../../src/engine/fetalCirculation/presentation';
import {
  DEFAULT_FETAL_INPUTS,
  FETAL_PRESETS,
  FETAL_PRESET_LABELS,
  FETAL_PRESET_ORDER,
  FETAL_PRESET_SETTLE_SECONDS,
} from '../../src/engine/fetalCirculation/presets';
import { perturbFirstBreath as perturbFirstBreath, perturbReopenDuct as perturbReopenDuct } from '../../src/engine/fetalCirculation/engine';
import { FETAL_QUESTIONS } from '../../src/engine/fetalCirculation/questions';
import type { FetalState, FetalDerived, FetalInputs, FetalHistoryPoint } from '../../src/engine/fetalCirculation/types';

import { immuneResponseNativeLoopConfig } from '../../src/engine/immuneResponse/nativeLoopConfig';
import { buildImmuneResponsePresentation } from '../../src/engine/immuneResponse/presentation';
import {
  DEFAULT_IMMUNE_INPUTS,
  IMMUNE_PRESETS,
  IMMUNE_PRESET_LABELS,
  PRESET_ORDER as IMMUNE_PRESET_ORDER,
} from '../../src/engine/immuneResponse/presets';
import { perturbInfect as perturbInfect, perturbVaccinate as perturbVaccinate } from '../../src/engine/immuneResponse/engine';
import { IMMUNE_QUESTIONS } from '../../src/engine/immuneResponse/questions';
import type { ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint } from '../../src/engine/immuneResponse/types';

import { hypersensitivityNativeLoopConfig } from '../../src/engine/hypersensitivity/nativeLoopConfig';
import { buildHypersensitivityPresentation } from '../../src/engine/hypersensitivity/presentation';
import {
  DEFAULT_HYPERSENSITIVITY_INPUTS,
  HYPERSENSITIVITY_PRESETS,
  HYPERSENSITIVITY_PRESET_LABELS,
  MECHANISM_PRESET_ORDER as HYPERSENSITIVITY_PRESET_ORDER,
} from '../../src/engine/hypersensitivity/presets';
import { perturbChallenge as perturbChallenge, perturbAdrenaline as perturbAdrenaline, perturbTransfuse as perturbTransfuse, perturbDiurese as perturbDiurese } from '../../src/engine/hypersensitivity/engine';
import { HYPERSENSITIVITY_QUESTIONS } from '../../src/engine/hypersensitivity/questions';
import type { HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint } from '../../src/engine/hypersensitivity/types';

import { thermoregulationNativeLoopConfig } from '../../src/engine/thermoregulation/nativeLoopConfig';
import { buildThermoregulationPresentation } from '../../src/engine/thermoregulation/presentation';
import {
  DEFAULT_THERMO_INPUTS,
  THERMO_PRESETS,
  THERMO_PRESET_LABELS,
  THERMO_PRESET_ORDER,
} from '../../src/engine/thermoregulation/presets';
import { perturbGiveAntipyretic as perturbGiveAntipyretic, perturbActiveCooling as perturbActiveCooling, perturbActiveRewarming as perturbActiveRewarming } from '../../src/engine/thermoregulation/engine';
import { THERMO_QUESTIONS } from '../../src/engine/thermoregulation/questions';
import type { ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint } from '../../src/engine/thermoregulation/types';

import { autonomicNervousNativeLoopConfig } from '../../src/engine/autonomicNervous/nativeLoopConfig';
import { buildAutonomicNervousPresentation } from '../../src/engine/autonomicNervous/presentation';
import {
  DEFAULT_ANS_INPUTS,
  ANS_PRESETS,
  ANS_PRESET_LABELS,
  PRESET_ORDER as ANS_PRESET_ORDER,
} from '../../src/engine/autonomicNervous/presets';
import { ANS_QUESTIONS } from '../../src/engine/autonomicNervous/questions';
import type { AnsState, AnsDerived, AnsInputs, AnsHistoryPoint } from '../../src/engine/autonomicNervous/types';

import { membranePotentialsNativeLoopConfig } from '../../src/engine/membranePotentials/nativeLoopConfig';
import { buildMembranePotentialsPresentation } from '../../src/engine/membranePotentials/presentation';
import {
  DEFAULT_MEMBRANE_INPUTS,
  MEMBRANE_PRESETS,
  MEMBRANE_PRESET_LABELS,
  PRESET_ORDER as MEMBRANE_PRESET_ORDER,
} from '../../src/engine/membranePotentials/presets';
import { perturbStimulate as perturbMembraneStimulate } from '../../src/engine/membranePotentials/engine';
import { MEMBRANE_QUESTIONS } from '../../src/engine/membranePotentials/questions';
import type { MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint } from '../../src/engine/membranePotentials/types';
/* ------------------------------------------------------------------ */
/*  Module adapters                                                    */
/* ------------------------------------------------------------------ */

interface ModuleAdapter<TState, TInputs, TDerived, THistoryPoint> {
  title: string;
  accent: string;
  config: NativeLoopConfig<TState, TInputs, TDerived, THistoryPoint>;
  build: (ctx: PresentationContext<TState, TDerived, TInputs, THistoryPoint>) => ModulePresentation<TState, TDerived, TInputs, THistoryPoint>;
  defaults: TInputs;
  presets: Record<string, Partial<TInputs>>;
  labels: Record<string, string>;
  order: string[];
  settleOverrides?: Record<string, number>;
    
  questions: readonly any[];
  presetActiveKey: (id: string) => string;
  actions: (inputs: TInputs, perturb: (fn: (state: TState) => TState) => void) => { label: string; onPress: () => void; variant: 'impulse' }[];
}

const MODULE_ADAPTERS: Record<string, ModuleAdapter<unknown, unknown, unknown, unknown>> = {
  glucoseRegulation: {
    title: 'Glucose Regulation',
    accent: '#22c55e',
     
    config: glucoseNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<GlucoseState, GlucoseDerived, GlucoseInputs, GlucoseHistoryPoint>) =>
      buildGlucosePresentation(ctx)) as any,
     
    defaults: DEFAULT_GLUCOSE_INPUTS as any,
     
    presets: GLUCOSE_PRESETS as any,
     
    labels: GLUCOSE_PRESET_LABELS as any,
    order: GLUCOSE_PRESET_ORDER as string[],
    questions: GLUCOSE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Eat meal', onPress: () => perturb((s) => perturbEatMeal(s as GlucoseState, (inputs as GlucoseInputs).mealCarbLoadGrams)), variant: 'impulse' },
      { label: 'Give insulin', onPress: () => perturb((s) => perturbGiveInsulin(s as GlucoseState, (inputs as GlucoseInputs).exogenousInsulinUnits)), variant: 'impulse' },
    ],
  },
  cardiorenal: {
    title: 'Cardiorenal',
    accent: '#ef4444',
     
    config: cardiorenalNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>) =>
      buildCardiorenalPresentation(ctx)) as any,
     
    defaults: CARDIORENAL_DEFAULTS as any,
     
    presets: CARDIORENAL_PRESETS as any,
     
    labels: CARDIORENAL_PRESET_LABELS as any,
    order: CARDIORENAL_PRESET_ORDER as string[],
    questions: CARDIORENAL_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (_, perturb) => [
      { label: 'Haemorrhage', onPress: () => perturb((s) => perturbBloodVolume(s as SimState, 0.7)), variant: 'impulse' },
    ],
  },
  respiratory: {
    title: 'Respiratory & Acid-Base',
    accent: '#3b82f6',
     
    config: respiratoryNativeLoopConfig as any,
     
    build: ((ctx: PresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>) =>
      buildRespiratoryPresentation(ctx)) as any,
     
    defaults: DEFAULT_RESP_INPUTS as any,
     
    presets: RESP_PRESETS as any,
     
    labels: RESP_PRESET_LABELS as any,
    order: RESP_PRESET_ORDER as string[],
    questions: RESPIRATORY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (_, perturb) => [
      { label: 'Airway obstruction', onPress: () => perturb((s) => perturbAirwayObstruction(s as RespState)), variant: 'impulse' },
    ],
  },

  adrenalCortex: {
    title: 'Adrenal Cortex: Steroidogenesis & CAH',
    accent: '#9e6215',

    config: adrenalCortexNativeLoopConfig as any,

    build: ((ctx: PresentationContext<AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint>) =>
      buildAdrenalCortexPresentation(ctx)) as any,

    defaults: DEFAULT_ADRENAL_INPUTS as any,

    presets: ADRENAL_PRESETS as any,

    labels: ADRENAL_PRESET_LABELS as any,
    order: ADRENAL_PRESET_ORDER as string[],
    questions: ADRENAL_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  adrenalMedulla: {
    title: 'Adrenal Medulla & Phaeochromocytoma',
    accent: '#a02f2f',

    config: adrenalMedullaNativeLoopConfig as any,

    build: ((ctx: PresentationContext<MedullaInternalState, MedullaDerived, MedullaInputs, MedullaHistoryPoint>) =>
      buildAdrenalMedullaPresentation(ctx)) as any,

    defaults: DEFAULT_MEDULLA_INPUTS as any,

    presets: MEDULLA_PRESETS as any,

    labels: MEDULLA_PRESET_LABELS as any,
    order: MEDULLA_PRESET_ORDER as string[],
    questions: MEDULLA_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Paroxysm', onPress: () => perturb((s) => perturbParoxysm(s as any)), variant: 'impulse' },
    ],
  },
  anteriorPituitary: {
    title: 'Anterior Pituitary: GH & Prolactin',
    accent: '#7c4f8f',

    config: anteriorPituitaryNativeLoopConfig as any,

    build: ((ctx: PresentationContext<PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint>) =>
      buildAnteriorPituitaryPresentation(ctx)) as any,

    defaults: DEFAULT_PITUITARY_INPUTS as any,

    presets: PITUITARY_PRESETS as any,

    labels: PITUITARY_PRESET_LABELS as any,
    order: PITUITARY_PRESET_ORDER as string[],
    questions: PITUITARY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Glucose load', onPress: () => perturb((s) => perturbGlucoseLoad(s as any)), variant: 'impulse' },
      { label: 'Bromocriptine', onPress: () => perturb((s) => perturbBromocriptineDose(s as any)), variant: 'impulse' },
    ],
  },
  hpaAxis: {
    title: 'HPA Axis',
    accent: '#9e6215',

    config: hpaAxisNativeLoopConfig as any,

    build: ((ctx: PresentationContext<HpaState, HpaDerived, HpaInputs, HpaHistoryPoint>) =>
      buildHpaPresentation(ctx)) as any,

    defaults: DEFAULT_HPA_INPUTS as any,

    presets: HPA_PRESETS as any,

    labels: HPA_PRESET_LABELS as any,
    order: HPA_PRESET_ORDER as string[],
    questions: HPA_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Acute stressor', onPress: () => perturb((s) => perturbAcuteStressor(s as any, 110)), variant: 'impulse' },
    ],
  },
  hpgAxis: {
    title: 'HPG Axis',
    accent: '#c2258c',

    config: hpgAxisNativeLoopConfig as any,

    build: ((ctx: PresentationContext<HpgState, HpgDerived, HpgInputs, HpgHistoryPoint>) =>
      buildHpgPresentation(ctx)) as any,

    defaults: DEFAULT_HPG_INPUTS as any,

    presets: HPG_PRESETS as any,

    labels: HPG_PRESET_LABELS as any,
    order: HPG_PRESET_ORDER as string[],
    questions: HPG_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  hptAxis: {
    title: 'Thyroid (HPT) Axis',
    accent: '#0b7d6b',

    config: hptAxisNativeLoopConfig as any,

    build: ((ctx: PresentationContext<HptState, HptDerived, HptInputs, HptHistoryPoint>) =>
      buildHptPresentation(ctx)) as any,

    defaults: DEFAULT_HPT_INPUTS as any,

    presets: HPT_PRESETS as any,

    labels: HPT_PRESET_LABELS as any,
    order: HPT_PRESET_ORDER as string[],
    questions: HPT_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Acute illness', onPress: () => perturb((s) => perturbAcuteIllness(s as any, 1)), variant: 'impulse' },
    ],
  },
  calciumHomeostasis: {
    title: 'Calcium & Bone/Mineral',
    accent: '#c43d75',

    config: calciumHomeostasisNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint>) =>
      buildCalciumHomeostasisPresentation(ctx)) as any,

    defaults: DEFAULT_CALCIUM_INPUTS as any,

    presets: CALCIUM_PRESETS as any,

    labels: CALCIUM_PRESET_LABELS as any,
    order: CALCIUM_PRESET_ORDER as string[],
    questions: CALCIUM_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Calcium infusion', onPress: () => perturb((s) => perturbCalciumInfusion(s as any, 25)), variant: 'impulse' },
    ],
  },
  cardiacElectro: {
    title: 'Cardiac Cycle & PV Loop',
    accent: '#b02a5e',

    config: cardiacElectroNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint>) =>
      buildCardiacElectroPresentation(ctx)) as any,

    defaults: DEFAULT_CARDIAC_INPUTS as any,

    presets: CARDIAC_PRESETS as any,

    labels: CARDIAC_PRESET_LABELS as any,
    order: CARDIAC_PRESET_ORDER as string[],
    questions: CARDIAC_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  ecgConduction: {
    title: 'ECG & Cardiac Conduction',
    accent: '#177d36',

    config: ecgConductionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<EcgState, EcgDerived, EcgInputs, EcgHistoryPoint>) =>
      buildEcgConductionPresentation(ctx)) as any,

    defaults: DEFAULT_ECG_INPUTS as any,

    presets: ECG_PRESETS as any,

    labels: ECG_PRESET_LABELS as any,
    order: ECG_PRESET_ORDER as string[],
    questions: ECG_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  coronaryCirculation: {
    title: 'Coronary Circulation',
    accent: '#c62828',

    config: coronaryCirculationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CoronaryInternalState, CoronaryDerived, CoronaryInputs, CoronaryHistoryPoint>) =>
      buildCoronaryCirculationPresentation(ctx)) as any,

    defaults: DEFAULT_CORONARY_INPUTS as any,

    presets: CORONARY_PRESETS as any,

    labels: CORONARY_PRESET_LABELS as any,
    order: CORONARY_PRESET_ORDER as string[],
    questions: CORONARY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Exertion', onPress: () => perturb((s) => perturbExertion(s as any)), variant: 'impulse' },
      { label: 'Coronary vasospasm', onPress: () => perturb((s) => perturbVasospasm(s as any)), variant: 'impulse' },
    ],
  },
  venousReturn: {
    title: 'Venous Return & Cardiac Function',
    accent: '#3b4fa0',

    config: venousReturnNativeLoopConfig as any,

    build: ((ctx: PresentationContext<VenousReturnState, VenousReturnDerived, VenousReturnInputs, VenousReturnHistoryPoint>) =>
      buildVenousReturnPresentation(ctx)) as any,

    defaults: DEFAULT_VENOUS_RETURN_INPUTS as any,

    presets: VENOUS_RETURN_PRESETS as any,

    labels: VENOUS_RETURN_PRESET_LABELS as any,
    order: VENOUS_RETURN_PRESET_ORDER as string[],
    questions: VENOUS_RETURN_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Haemorrhage', onPress: () => perturb((s) => perturbHemorrhage(s as any, 1000)), variant: 'impulse' },
      { label: 'Transfusion', onPress: () => perturb((s) => perturbTransfusion(s as any, 1000)), variant: 'impulse' },
      { label: 'Valsalva', onPress: () => perturb((s) => perturbValsalva(s as any)), variant: 'impulse' },
    ],
  },
  respiratoryMechanics: {
    title: 'Respiratory Mechanics & Spirometry',
    accent: '#0f7c66',

    config: respiratoryMechanicsNativeLoopConfig as any,

    build: ((ctx: PresentationContext<RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint>) =>
      buildRespiratoryMechanicsPresentation(ctx)) as any,

    defaults: DEFAULT_RESP_MECH_INPUTS as any,

    presets: RESP_MECH_PRESETS as any,

    labels: RESP_MECH_PRESET_LABELS as any,
    order: RESP_MECH_PRESET_ORDER as string[],
    questions: RESP_MECH_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'FVC manoeuvre', onPress: () => perturb((s) => perturbFvcManeuver(s as any)), variant: 'impulse' },
    ],
  },
  renalTubular: {
    title: 'Renal Tubular Physiology',
    accent: '#0e7d94',

    config: renalTubularNativeLoopConfig as any,

    build: ((ctx: PresentationContext<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint>) =>
      buildRenalTubularPresentation(ctx)) as any,

    defaults: DEFAULT_RENAL_TUBULAR_INPUTS as any,

    presets: RENAL_TUBULAR_PRESETS as any,

    labels: RENAL_TUBULAR_PRESET_LABELS as any,
    order: RENAL_TUBULAR_PRESET_ORDER as string[],
    questions: RENAL_TUBULAR_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Water deprivation', onPress: () => perturb((s) => perturbWaterDeprivation(s as any, 120)), variant: 'impulse' },
    ],
  },
  electrolyteBalance: {
    title: 'Potassium & Sodium-Water Balance',
    accent: '#0b6f93',

    config: electrolyteBalanceNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint>) =>
      buildElectrolyteBalancePresentation(ctx)) as any,

    defaults: DEFAULT_ELECTROLYTE_INPUTS as any,

    presets: ELECTROLYTE_PRESETS as any,

    labels: ELECTROLYTE_PRESET_LABELS as any,
    order: ELECTROLYTE_PRESET_ORDER as string[],
    questions: ELECTROLYTE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Give insulin', onPress: () => perturb((s) => perturbElectrolyteGiveInsulin(s as any, 0.22)), variant: 'impulse' },
      { label: 'Saline bolus', onPress: () => perturb((s) => perturbSalineBolus(s as any, 1)), variant: 'impulse' },
      { label: 'Potassium bolus', onPress: () => perturb((s) => perturbPotassiumBolus(s as any, 25)), variant: 'impulse' },
    ],
  },
  capillaryExchange: {
    title: 'Capillary Exchange & Oedema',
    accent: '#c0396b',

    config: capillaryExchangeNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint>) =>
      buildCapillaryExchangePresentation(ctx)) as any,

    defaults: DEFAULT_CAPILLARY_INPUTS as any,

    presets: CAPILLARY_PRESETS as any,

    labels: CAPILLARY_PRESET_LABELS as any,
    order: CAPILLARY_PRESET_ORDER as string[],
    questions: CAPILLARY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Albumin infusion', onPress: () => perturb((s) => perturbAlbuminInfusion(s as any, 500)), variant: 'impulse' },
      { label: 'Stand up', onPress: () => perturb((s) => perturbStandUp(s as any, 0.04)), variant: 'impulse' },
    ],
  },
  gastrointestinal: {
    title: 'GI Physiology',
    accent: '#8f6a10',

    config: gastrointestinalNativeLoopConfig as any,

    build: ((ctx: PresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>) =>
      buildGastrointestinalPresentation(ctx)) as any,

    defaults: DEFAULT_GI_INPUTS as any,

    presets: GI_PRESETS as any,

    labels: GI_PRESET_LABELS as any,
    order: GI_PRESET_ORDER as string[],
    questions: GI_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Eat a meal', onPress: () => perturb((s) => perturbGI_EatMeal(s as any)), variant: 'impulse' },
    ],
  },
  digestionAbsorption: {
    title: 'Digestion & Absorption',
    accent: '#8f6a10',

    config: digestionAbsorptionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint>) =>
      buildDigestionAbsorptionPresentation(ctx)) as any,

    defaults: DEFAULT_DIGESTION_INPUTS as any,

    presets: DIGESTION_PRESETS as any,

    labels: DIGESTION_PRESET_LABELS as any,
    order: DIGESTION_PRESET_ORDER as string[],
    questions: DIGESTION_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Eat a meal', onPress: () => perturb((s) => perturbDigest_EatMeal(s as any)), variant: 'impulse' },
    ],
  },
  enzymeKinetics: {
    title: 'Enzyme Kinetics & Inhibition',
    accent: '#177d36',

    config: enzymeKineticsNativeLoopConfig as any,

    build: ((ctx: PresentationContext<KineticsInternalState, KineticsDerived, KineticsInputs, KineticsHistoryPoint>) =>
      buildEnzymeKineticsPresentation(ctx)) as any,

    defaults: DEFAULT_KINETICS_INPUTS as any,

    presets: KINETICS_PRESETS as any,

    labels: KINETICS_PRESET_LABELS as any,
    order: KINETICS_PRESET_ORDER as string[],
    questions: KINETICS_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  liverPhysiology: {
    title: 'Liver & Bilirubin Metabolism',
    accent: '#99551b',

    config: liverPhysiologyNativeLoopConfig as any,

    build: ((ctx: PresentationContext<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint>) =>
      buildLiverPhysiologyPresentation(ctx)) as any,

    defaults: DEFAULT_LIVER_INPUTS as any,

    presets: LIVER_PRESETS as any,

    labels: LIVER_PRESET_LABELS as any,
    order: LIVER_PRESET_ORDER as string[],
    questions: LIVER_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Haemolytic episode', onPress: () => perturb((s) => perturbHaemolyticEpisode(s as any)), variant: 'impulse' },
      { label: 'Alcohol binge', onPress: () => perturb((s) => perturbAlcoholBinge(s as any)), variant: 'impulse' },
      { label: 'Stent obstruction', onPress: () => perturb((s) => perturbStentObstruction(s as any)), variant: 'impulse' },
    ],
  },
  bloodGroups: {
    title: 'Blood Groups & Transfusion Reactions',
    accent: '#2f6db5',

    config: bloodGroupsNativeLoopConfig as any,

    build: ((ctx: PresentationContext<BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint>) =>
      buildBloodGroupsPresentation(ctx)) as any,

    defaults: DEFAULT_BLOOD_INPUTS as any,

    presets: BLOOD_PRESETS as any,

    labels: BLOOD_PRESET_LABELS as any,
    order: BLOOD_PRESET_ORDER as string[],
    questions: BLOOD_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  coagulation: {
    title: 'Coagulation & Hemostasis',
    accent: '#9b45d1',

    config: coagulationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CoagState, CoagDerived, CoagInputs, CoagHistoryPoint>) =>
      buildCoagulationPresentation(ctx)) as any,

    defaults: DEFAULT_COAG_INPUTS as any,

    presets: COAG_PRESETS as any,

    labels: COAG_PRESET_LABELS as any,
    order: COAG_PRESET_ORDER as string[],
    questions: COAGULATION_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Injury', onPress: () => perturb((s) => perturbInjury(s as any, 1)), variant: 'impulse' },
    ],
  },
  erythropoiesis: {
    title: 'Erythropoiesis & Anemia',
    accent: '#c62828',

    config: erythropoiesisNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint>) =>
      buildErythropoiesisPresentation(ctx)) as any,

    defaults: DEFAULT_ERYTHRO_INPUTS as any,

    presets: ERYTHRO_PRESETS as any,

    labels: ERYTHRO_PRESET_LABELS as any,
    order: ERYTHRO_PRESET_ORDER as string[],
    questions: ERYTHROPOIESIS_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Acute blood loss', onPress: () => perturb((s) => perturbAcuteBloodLoss(s as any, 40)), variant: 'impulse' },
    ],
  },
  shockStates: {
    title: 'Shock States',
    accent: '#c62828',

    config: shockStatesNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ShockState, ShockDerived, ShockInputs, ShockHistoryPoint>) =>
      buildShockStatesPresentation(ctx)) as any,

    defaults: DEFAULT_SHOCK_INPUTS as any,

    presets: SHOCK_PRESETS as any,

    labels: SHOCK_PRESET_LABELS as any,
    order: SHOCK_PRESET_ORDER as string[],
    questions: SHOCK_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Haemorrhage', onPress: () => perturb((s) => perturbHaemorrhage(s as any, 1000)), variant: 'impulse' },
      { label: 'Fluid bolus', onPress: () => perturb((s) => perturbFluidBolus(s as any, 1000)), variant: 'impulse' },
    ],
  },
  inflammation: {
    title: 'Inflammation',
    accent: '#c62828',

    config: inflammationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint>) =>
      buildInflammationPresentation(ctx)) as any,

    defaults: DEFAULT_INFLAMMATION_INPUTS as any,

    presets: INFLAMMATION_PRESETS as any,

    labels: INFLAMMATION_PRESET_LABELS as any,
    order: INFLAMMATION_PRESET_ORDER as string[],
    questions: INFLAMMATION_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'New insult', onPress: () => perturb((s) => perturbNewInsult(s as any, 50)), variant: 'impulse' },
      { label: 'Drain abscess', onPress: () => perturb((s) => perturbDrainAbscess(s as any, 0.8)), variant: 'impulse' },
    ],
  },
  cerebralPerfusion: {
    title: 'Cerebral Perfusion, ICP & CSF',
    accent: '#7c6d00',

    config: cerebralPerfusionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CerebralInternalState, CerebralDerived, CerebralInputs, CerebralHistoryPoint>) =>
      buildCerebralPerfusionPresentation(ctx)) as any,

    defaults: DEFAULT_CEREBRAL_INPUTS as any,

    presets: CEREBRAL_PRESETS as any,

    labels: CEREBRAL_PRESET_LABELS as any,
    order: CEREBRAL_PRESET_ORDER as string[],
    questions: CEREBRAL_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Drain CSF', onPress: () => perturb((s) => perturbDrainCsf(s as any, 120)), variant: 'impulse' },
      { label: 'Acute bleed', onPress: () => perturb((s) => perturbAcuteBleed(s as any, 200)), variant: 'impulse' },
    ],
  },
  motorControl: {
    title: 'Motor Control: Basal Ganglia & Cerebellum',
    accent: '#47679e',

    config: motorControlNativeLoopConfig as any,

    build: ((ctx: PresentationContext<MotorInternalState, MotorDerived, MotorInputs, MotorHistoryPoint>) =>
      buildMotorControlPresentation(ctx)) as any,

    defaults: DEFAULT_MOTOR_INPUTS as any,

    presets: MOTOR_PRESETS as any,

    labels: MOTOR_PRESET_LABELS as any,
    order: MOTOR_PRESET_ORDER as string[],
    questions: MOTOR_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Levodopa', onPress: () => perturb((s) => perturbLevodopaDose(s as any)), variant: 'impulse' },
      { label: 'Toggle DBS', onPress: () => perturb((s) => perturbToggleDbs(s as any)), variant: 'impulse' },
    ],
  },
  somaticSensation: {
    title: 'Somatosensation & Pain Pathways',
    accent: '#8c2f39',

    config: somaticSensationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<SomaticInternalState, SomaticDerived, SomaticInputs, SomaticHistoryPoint>) =>
      buildSomaticSensationPresentation(ctx)) as any,

    defaults: DEFAULT_SOMATIC_INPUTS as any,

    presets: SOMATIC_PRESETS as any,

    labels: SOMATIC_PRESET_LABELS as any,
    order: SOMATIC_PRESET_ORDER as string[],
    questions: SOMATIC_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Opioid bolus', onPress: () => perturb((s) => perturbOpioidBolus(s as any)), variant: 'impulse' },
      { label: 'Tissue injury', onPress: () => perturb((s) => perturbTissueInjury(s as any)), variant: 'impulse' },
    ],
  },
  muscleContraction: {
    title: 'Muscle & EC Coupling',
    accent: '#a8452b',

    config: muscleContractionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<MuscleState, MuscleDerived, MuscleInputs, MuscleHistoryPoint>) =>
      buildMuscleContractionPresentation(ctx)) as any,

    defaults: DEFAULT_MUSCLE_INPUTS as any,

    presets: MUSCLE_PRESETS as any,

    labels: MUSCLE_PRESET_LABELS as any,
    order: MUSCLE_PRESET_ORDER as string[],
    questions: MUSCLE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Stimulate', onPress: () => perturb((s) => perturbMuscleStimulate(s as any)), variant: 'impulse' },
      { label: 'Caffeine', onPress: () => perturb((s) => perturbCaffeine(s as any, 0.35)), variant: 'impulse' },
    ],
  },
  neuromuscularJunction: {
    title: 'Neuromuscular Junction',
    accent: '#7c6d00',

    config: neuromuscularJunctionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<NmjState, NmjDerived, NmjInputs, NmjHistoryPoint>) =>
      buildNeuromuscularJunctionPresentation(ctx)) as any,

    defaults: DEFAULT_NMJ_INPUTS as any,

    presets: NMJ_PRESETS as any,

    labels: NMJ_PRESET_LABELS as any,
    order: NMJ_PRESET_ORDER as string[],
    questions: NMJ_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Tetanic burst', onPress: () => perturb((s) => perturbTetanicBurst(s as any)), variant: 'impulse' },
      { label: 'Rest', onPress: () => perturb((s) => perturbRest(s as any)), variant: 'impulse' },
    ],
  },
  hearing: {
    title: 'Hearing & Cochlear Mechanics',
    accent: '#a06a10',

    config: hearingNativeLoopConfig as any,

    build: ((ctx: PresentationContext<HearingInternalState, HearingDerived, HearingInputs, HearingHistoryPoint>) =>
      buildHearingPresentation(ctx)) as any,

    defaults: DEFAULT_HEARING_INPUTS as any,

    presets: HEARING_PRESETS as any,

    labels: HEARING_PRESET_LABELS as any,
    order: HEARING_PRESET_ORDER as string[],
    questions: HEARING_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Noise exposure', onPress: () => perturb((s) => perturbNoiseExposure(s as any)), variant: 'impulse' },
    ],
  },
  vestibular: {
    title: 'Vestibular System & Vertigo',
    accent: '#0f7c66',

    config: vestibularNativeLoopConfig as any,

    build: ((ctx: PresentationContext<VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint>) =>
      buildVestibularPresentation(ctx)) as any,

    defaults: DEFAULT_VESTIBULAR_INPUTS as any,

    presets: VESTIBULAR_PRESETS as any,

    labels: VESTIBULAR_PRESET_LABELS as any,
    order: VESTIBULAR_PRESET_ORDER as string[],
    questions: VESTIBULAR_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Perform Hallpike', onPress: () => perturb((s) => perturbPerformHallpike(s as any)), variant: 'impulse' },
      { label: 'Head impulse', onPress: () => perturb((s) => perturbHeadImpulse(s as any)), variant: 'impulse' },
    ],
  },
  vision: {
    title: 'Vision & Phototransduction',
    accent: '#6d4fc1',

    config: visionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint>) =>
      buildVisionPresentation(ctx)) as any,

    defaults: DEFAULT_VISION_INPUTS as any,

    presets: VISION_PRESETS as any,

    labels: VISION_PRESET_LABELS as any,
    order: VISION_PRESET_ORDER as string[],
    questions: VISION_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Lights out', onPress: () => perturb((s) => perturbLightsOut(s as any)), variant: 'impulse' },
      { label: 'Bright glare', onPress: () => perturb((s) => perturbBrightGlare(s as any)), variant: 'impulse' },
      { label: 'Shine torch', onPress: () => perturb((s) => perturbShineTorch(s as any, 1)), variant: 'impulse' },
      { label: 'Torch off', onPress: () => perturb((s) => perturbTorchOff(s as any)), variant: 'impulse' },
    ],
  },
  cellCycle: {
    title: 'Cell Cycle & Checkpoints',
    accent: '#0a72b8',

    config: cellCycleNativeLoopConfig as any,

    build: ((ctx: PresentationContext<CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint>) =>
      buildCellCyclePresentation(ctx)) as any,

    defaults: DEFAULT_CELL_CYCLE_INPUTS as any,

    presets: CELL_CYCLE_PRESETS as any,

    labels: CELL_CYCLE_PRESET_LABELS as any,
    order: CELL_CYCLE_PRESET_ORDER as string[],
    questions: CELL_CYCLE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  micturition: {
    title: 'Micturition',
    accent: '#0a72b8',

    config: micturitionNativeLoopConfig as any,

    build: ((ctx: PresentationContext<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint>) =>
      buildMicturitionPresentation(ctx)) as any,

    defaults: DEFAULT_MICTURITION_INPUTS as any,

    presets: MICTURITION_PRESETS as any,

    labels: MICTURITION_PRESET_LABELS as any,
    order: MICTURITION_PRESET_ORDER as string[],
    questions: MICTURITION_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  pregnancy: {
    title: 'Maternal Physiology, Labour & Lactation',
    accent: '#2e7ea2',

    config: pregnancyNativeLoopConfig as any,

    build: ((ctx: PresentationContext<PregnancyInternalState, PregnancyDerived, PregnancyInputs, PregnancyHistoryPoint>) =>
      buildPregnancyPresentation(ctx)) as any,

    defaults: DEFAULT_PREGNANCY_INPUTS as any,

    presets: PREGNANCY_PRESETS as any,

    labels: PREGNANCY_PRESET_LABELS as any,
    order: PREGNANCY_PRESET_ORDER as string[],
    questions: PREGNANCY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Start labour', onPress: () => perturb((s) => perturbStartLabour(s as any)), variant: 'impulse' },
      { label: 'Feed now', onPress: () => perturb((s) => perturbFeedNow(s as any)), variant: 'impulse' },
    ],
  },
  exercisePhysiology: {
    title: 'Exercise Physiology',
    accent: '#2e7d46',

    config: exercisePhysiologyNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint>) =>
      buildExercisePhysiologyPresentation(ctx)) as any,

    defaults: DEFAULT_EXERCISE_INPUTS as any,

    presets: EXERCISE_PRESETS as any,

    labels: EXERCISE_PRESET_LABELS as any,
    order: EXERCISE_PRESET_ORDER as string[],
    questions: EXERCISE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Sprint surge', onPress: () => perturb((s) => perturbSprintSurge(s as any)), variant: 'impulse' },
    ],
  },
  fetalCirculation: {
    title: 'Fetal & Neonatal Circulation',
    accent: '#0a72b8',

    config: fetalCirculationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<FetalState, FetalDerived, FetalInputs, FetalHistoryPoint>) =>
      buildFetalCirculationPresentation(ctx)) as any,

    defaults: DEFAULT_FETAL_INPUTS as any,

    presets: FETAL_PRESETS as any,

    labels: FETAL_PRESET_LABELS as any,
    order: FETAL_PRESET_ORDER as string[],
    questions: FETAL_QUESTIONS as any,
    settleOverrides: FETAL_PRESET_SETTLE_SECONDS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'First breath', onPress: () => perturb((s) => perturbFirstBreath(s as any)), variant: 'impulse' },
      { label: 'Reopen duct', onPress: () => perturb((s) => perturbReopenDuct(s as any)), variant: 'impulse' },
    ],
  },
  immuneResponse: {
    title: 'Immune Response',
    accent: '#8a3fb5',

    config: immuneResponseNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint>) =>
      buildImmuneResponsePresentation(ctx)) as any,

    defaults: DEFAULT_IMMUNE_INPUTS as any,

    presets: IMMUNE_PRESETS as any,

    labels: IMMUNE_PRESET_LABELS as any,
    order: IMMUNE_PRESET_ORDER as string[],
    questions: IMMUNE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Infect', onPress: () => perturb((s) => perturbInfect(s as any)), variant: 'impulse' },
      { label: 'Vaccinate', onPress: () => perturb((s) => perturbVaccinate(s as any)), variant: 'impulse' },
    ],
  },
  hypersensitivity: {
    title: 'Hypersensitivity',
    accent: '#c2258c',

    config: hypersensitivityNativeLoopConfig as any,

    build: ((ctx: PresentationContext<HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint>) =>
      buildHypersensitivityPresentation(ctx)) as any,

    defaults: DEFAULT_HYPERSENSITIVITY_INPUTS as any,

    presets: HYPERSENSITIVITY_PRESETS as any,

    labels: HYPERSENSITIVITY_PRESET_LABELS as any,
    order: HYPERSENSITIVITY_PRESET_ORDER as string[],
    questions: HYPERSENSITIVITY_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Challenge', onPress: () => perturb((s) => perturbChallenge(s as any, 100)), variant: 'impulse' },
      { label: 'Adrenaline', onPress: () => perturb((s) => perturbAdrenaline(s as any)), variant: 'impulse' },
      { label: 'Transfuse', onPress: () => perturb((s) => perturbTransfuse(s as any)), variant: 'impulse' },
      { label: 'Diurese', onPress: () => perturb((s) => perturbDiurese(s as any)), variant: 'impulse' },
    ],
  },
  thermoregulation: {
    title: 'Thermoregulation, Fever & Heat Illness',
    accent: '#c65200',

    config: thermoregulationNativeLoopConfig as any,

    build: ((ctx: PresentationContext<ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint>) =>
      buildThermoregulationPresentation(ctx)) as any,

    defaults: DEFAULT_THERMO_INPUTS as any,

    presets: THERMO_PRESETS as any,

    labels: THERMO_PRESET_LABELS as any,
    order: THERMO_PRESET_ORDER as string[],
    questions: THERMO_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Antipyretic', onPress: () => perturb((s) => perturbGiveAntipyretic(s as any)), variant: 'impulse' },
      { label: 'Active cooling', onPress: () => perturb((s) => perturbActiveCooling(s as any)), variant: 'impulse' },
      { label: 'Active rewarming', onPress: () => perturb((s) => perturbActiveRewarming(s as any)), variant: 'impulse' },
    ],
  },
  autonomicNervous: {
    title: 'Autonomic Nervous System',
    accent: '#bd481a',

    config: autonomicNervousNativeLoopConfig as any,

    build: ((ctx: PresentationContext<AnsState, AnsDerived, AnsInputs, AnsHistoryPoint>) =>
      buildAutonomicNervousPresentation(ctx)) as any,

    defaults: DEFAULT_ANS_INPUTS as any,

    presets: ANS_PRESETS as any,

    labels: ANS_PRESET_LABELS as any,
    order: ANS_PRESET_ORDER as string[],
    questions: ANS_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: () => [],
  },
  membranePotentials: {
    title: 'Membrane & Action Potentials',
    accent: '#7c6d00',

    config: membranePotentialsNativeLoopConfig as any,

    build: ((ctx: PresentationContext<MembraneState, MembraneDerived, MembraneInputs, MembraneHistoryPoint>) =>
      buildMembranePotentialsPresentation(ctx)) as any,

    defaults: DEFAULT_MEMBRANE_INPUTS as any,

    presets: MEMBRANE_PRESETS as any,

    labels: MEMBRANE_PRESET_LABELS as any,
    order: MEMBRANE_PRESET_ORDER as string[],
    questions: MEMBRANE_QUESTIONS as any,
    presetActiveKey: (id: string) => id,
    actions: (inputs, perturb) => [
      { label: 'Stimulate', onPress: () => perturb((s) => perturbMembraneStimulate(s as any, 1)), variant: 'impulse' },
    ],
  },};

/* ------------------------------------------------------------------ */
/*  Generic live module screen                                         */
/* ------------------------------------------------------------------ */

/** A pattern question has an `options` field; a prediction question has an intervention. */
function isPatternLike(q: any): boolean {
  return Boolean(q && 'options' in q);
}

/** Freeze the current trace as a dotted overlay to compare a scenario against a patient's own
 *  baseline — the same "frozen baseline" teaching feature the web app uses for two-run
 *  comparisons. */
function BaselineBar({ hasBaseline, onCapture, onClear }: { hasBaseline: boolean; onCapture: () => void; onClear: () => void }) {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={styles.baselineBar}>
      <Text style={[styles.baselineHint, isDark && styles.textMuted]}>
        {hasBaseline ? 'Baseline frozen — running trace overlays it' : 'Freeze this trace to compare scenarios'}
      </Text>
      {hasBaseline ? (
        <Pressable onPress={onClear} style={({ pressed }) => [styles.baselineButton, pressed && styles.optionPressed]}>
          <Text style={styles.baselineButtonText}>Clear baseline</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onCapture} style={({ pressed }) => [styles.baselineButton, pressed && styles.optionPressed]}>
          <Text style={styles.baselineButtonText}>Set baseline</Text>
        </Pressable>
      )}
    </View>
  );
}

function EngineModuleScreen<TState, TInputs, TDerived, THistoryPoint>({
  adapter,
}: {
  adapter: ModuleAdapter<TState, TInputs, TDerived, THistoryPoint>;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [inputs, setInputs] = useState<TInputs>(adapter.defaults);
   
  const loop = useNativeEngineLoop<TState, TInputs, TDerived, THistoryPoint>(inputs, adapter.config as any);
  const { snapshot, history, baseline, reset, perturb, fastForward } = loop;

  const handleChange = useMemo(
    () => <K extends keyof TInputs>(key: K, value: TInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

   
  const presentation = useMemo(
    () =>
      adapter.build({
        state: snapshot.state,
        derived: snapshot.derived,
        inputs,
        history,
        baselineHistory: baseline.history,
         
      } as any),
    [snapshot, inputs, history, baseline.history, adapter],
  );

   
  const showCtx = useMemo(() => ({ state: snapshot.state, derived: snapshot.derived, inputs }) as any, [snapshot, inputs]);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const applyPreset = useMemo(
    () => (id: string) => {
      const presetInputs: TInputs = {
        ...adapter.defaults,
         
        ...(adapter.presets[id] as any),
      } as TInputs;
      setInputs(presetInputs);
      setActivePreset(adapter.presetActiveKey(id));
      reset(presetInputs);
      const extra = adapter.settleOverrides?.[id];
      if (extra) fastForward(extra, presetInputs);
    },
    [adapter, reset, fastForward],
  );

  const actions = useMemo(() => adapter.actions(inputs, perturb), [adapter, inputs, perturb]);

  // "Run in simulator" for a prediction question: reset to its SETUP (settled), then apply the
  // intervention's inputs and one-off perturb so the loop plays the watched direction live.
  const runQuestion = useMemo(
    () => (questionId: string) => {
      const q = adapter.questions.find((x) => x?.id === questionId) as any;
      if (!q || isPatternLike(q)) return;
      const setupInputs: TInputs = {
        ...adapter.defaults,
        ...(q.setup?.preset ? adapter.presets[q.setup.preset] : {}),
        ...q.setup?.inputs,
      } as TInputs;
      setInputs(setupInputs);
      setActivePreset(q.setup?.preset ?? null);
      reset(setupInputs);
      if (q.setup?.perturb) perturb(q.setup.perturb as (s: TState) => TState);
      const interventionInputs: TInputs = {
        ...setupInputs,
        ...q.intervention?.inputs,
      } as TInputs;
      setInputs(interventionInputs);
      if (q.intervention?.perturb) perturb(q.intervention.perturb as (s: TState) => TState);
    },
    [adapter, reset, perturb],
  );

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]} contentContainerStyle={styles.content}>
      {/* Without this the stack header reads the route pattern, "module/[id]". The module name
          lives there rather than in the page body, which is where a native app expects it. */}
      <Stack.Screen options={{ title: adapter.title }} />
      <ScenarioBar
        presets={adapter.order.map((id) => ({ id, label: adapter.labels[id] }))}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
        actions={actions}
      />
      {presentation.diagram.map((frame, i) => (
        <DiagramView key={frame.key ?? i} frame={frame} />
      ))}
      <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} />
      {presentation.charts.length > 0 && (
        <>
          <BaselineBar
            hasBaseline={baseline.history !== null}
            onCapture={baseline.capture}
            onClear={baseline.clear}
          />
          <TrendsView
            charts={presentation.charts}
            history={history}
            baselineHistory={baseline.history}
             
            derived={snapshot.derived as any}
          />
        </>
      )}
      <ControlRailView controls={presentation.controls} inputs={inputs} onChange={handleChange} />
      <PracticePanel
         
        config={adapter.config as any}
         
        defaults={adapter.defaults as any}
         
        presets={adapter.presets as any}
         
        questions={adapter.questions as any}
        title={adapter.title}
        accent={adapter.accent}
        onOpenScenario={applyPreset}
        onRunQuestion={runQuestion}
      />
    </ScrollView>
  );
}

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const adapter = MODULE_ADAPTERS[id ?? ''];

  if (!adapter) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>Module not found</Text>
      </View>
    );
  }

  return <EngineModuleScreen adapter={adapter} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748b' },
  textLight: { color: '#e2e8f0' },
  textMuted: { color: '#94a3b8' },
  baselineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  baselineHint: { fontSize: 12, color: '#475569', flexShrink: 1, paddingRight: 8 },
  baselineButton: { backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  baselineButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  optionPressed: { opacity: 0.6 },
});
