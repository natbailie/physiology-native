/**
 * The presentation schema, kept in sync with the web project.
 *
 * THE SOURCE OF TRUTH IS `physiology-app/src/shared/presentation/types.ts`. This file is a
 * byte-for-byte copy so the native project compiles without cross-project path tricks. When the
 * schema changes, re-copy it:
 *
 *   cp ../physiology-app/src/shared/presentation/types.ts src/presentation/presentationTypes.ts
 *
 * A test/migration script should compare the two and fail on drift.
 */
export type {
  ColorToken,
  StyleVars,
  SceneNode,
  GroupNode,
  PathNode,
  CircleNode,
  RectNode,
  LineNode,
  TextNode,
  VesselNode,
  AxisNode,
  OrganNode,
  OrganName,
  FrameNode,
  MarkerNode,
  ClipNode,
  ControlSpec,
  SliderControlSpec,
  ToggleControlSpec,
  SliderFormat,
  ReadoutContext,
  ReadoutSpec,
  ChartSpec,
  ChartContext,
  SparklineSpec,
  OdCurveSpec,
  ModulePresentation,
  PresentationContext,
  ShowContext,
} from './presentationTypes';
