import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface ModuleEntry {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
}

const MODULES: ModuleEntry[] = [
  {
    id: 'glucoseRegulation',
    name: 'Glucose Regulation',
    tagline: 'Insulin, glucagon & counter-regulatory hormones',
    accentColor: '#22c55e',
  },
  {
    id: 'cardiorenal',
    name: 'Cardiorenal',
    tagline: 'Heart & kidney feedback simulator',
    accentColor: '#ef4444',
  },
  {
    id: 'respiratory',
    name: 'Respiratory & Acid-Base',
    tagline: 'Ventilation, gas exchange & reading a blood gas',
    accentColor: '#3b82f6',
  },
  {
    id: 'adrenalCortex',
    name: 'Adrenal Cortex: Steroidogenesis & CAH',
    tagline: 'One pathway, four enzymes, a fingerprint at every block',
    accentColor: '#9e6215',
  },
  {
    id: 'adrenalMedulla',
    name: 'Adrenal Medulla & Phaeochromocytoma',
    tagline: 'Alpha raises it, beta moves the rest — block in the right order',
    accentColor: '#a02f2f',
  },
  {
    id: 'anteriorPituitary',
    name: 'Anterior Pituitary: GH & Prolactin',
    tagline: 'Autonomy, the dopamine brake & the glucose suppression test',
    accentColor: '#7c4f8f',
  },
  {
    id: 'hpaAxis',
    name: 'HPA Axis',
    tagline: 'Cortisol, stress response & adrenal insufficiency',
    accentColor: '#9e6215',
  },
  {
    id: 'hpgAxis',
    name: 'HPG Axis',
    tagline: 'GnRH, LH/FSH & the ovulatory LH surge',
    accentColor: '#c2258c',
  },
  {
    id: 'hptAxis',
    name: 'Thyroid (HPT) Axis',
    tagline: 'TSH, T4/T3 & thyroid function tests',
    accentColor: '#0b7d6b',
  },
  {
    id: 'calciumHomeostasis',
    name: 'Calcium & Bone/Mineral',
    tagline: 'PTH, calcitriol & phosphate regulation',
    accentColor: '#c43d75',
  },
  {
    id: 'cardiacElectro',
    name: 'Cardiac Cycle & PV Loop',
    tagline: 'Preload, afterload, contractility & the pressure-volume loop',
    accentColor: '#b02a5e',
  },
  {
    id: 'ecgConduction',
    name: 'ECG & Cardiac Conduction',
    tagline: 'How one dipole, seen twelve ways, writes an ECG',
    accentColor: '#177d36',
  },
  {
    id: 'coronaryCirculation',
    name: 'Coronary Circulation',
    tagline: 'Supply, demand & the vasodilatory reserve in between',
    accentColor: '#c62828',
  },
  {
    id: 'venousReturn',
    name: 'Venous Return & Cardiac Function',
    tagline: 'Filling pressure, the two curves & where they cross',
    accentColor: '#3b4fa0',
  },
  {
    id: 'respiratoryMechanics',
    name: 'Respiratory Mechanics & Spirometry',
    tagline: 'Lung volumes, compliance & V/Q matching',
    accentColor: '#0f7c66',
  },
  {
    id: 'renalTubular',
    name: 'Renal Tubular Physiology',
    tagline: 'Nephron segments, countercurrent multiplication & ADH',
    accentColor: '#0e7d94',
  },
  {
    id: 'electrolyteBalance',
    name: 'Potassium & Sodium-Water Balance',
    tagline: 'Serum vs total body, and tonicity vs volume',
    accentColor: '#0b6f93',
  },
  {
    id: 'capillaryExchange',
    name: 'Capillary Exchange & Oedema',
    tagline: 'Starling forces, the interstitium & lymphatic reserve',
    accentColor: '#c0396b',
  },
  {
    id: 'gastrointestinal',
    name: 'GI Physiology',
    tagline: 'Gastric acid, gut hormones & motility along the meal',
    accentColor: '#8f6a10',
  },
  {
    id: 'digestionAbsorption',
    name: 'Digestion & Absorption',
    tagline: 'Pancreas, bile, brush border & the stool that names the broken link',
    accentColor: '#8f6a10',
  },
  {
    id: 'enzymeKinetics',
    name: 'Enzyme Kinetics & Inhibition',
    tagline: 'One equation explains saturation, competition & drug class',
    accentColor: '#177d36',
  },
  {
    id: 'liverPhysiology',
    name: 'Liver & Bilirubin Metabolism',
    tagline: 'One pigment, three places to fail, read from urine and stool',
    accentColor: '#99551b',
  },
  {
    id: 'bloodGroups',
    name: 'Blood Groups & Transfusion Reactions',
    tagline: 'Preformed antibodies, and two reaction timelines that never overlap',
    accentColor: '#2f6db5',
  },
  {
    id: 'coagulation',
    name: 'Coagulation & Hemostasis',
    tagline: 'The clotting cascade, PT/APTT & anticoagulants',
    accentColor: '#9b45d1',
  },
  {
    id: 'erythropoiesis',
    name: 'Erythropoiesis & Anemia',
    tagline: 'EPO feedback, iron & B12, and classifying an anemia',
    accentColor: '#c62828',
  },
  {
    id: 'shockStates',
    name: 'Shock States',
    tagline: 'Four ways to fail, and the numbers that separate them',
    accentColor: '#c62828',
  },
  {
    id: 'inflammation',
    name: 'Inflammation',
    tagline: 'Acute response, resolution, and the conditions that prevent it',
    accentColor: '#c62828',
  },
  {
    id: 'cerebralPerfusion',
    name: 'Cerebral Perfusion, ICP & CSF',
    tagline: 'Monro-Kellie, the pressure-volume curve and CPP = MAP − ICP',
    accentColor: '#7c6d00',
  },
  {
    id: 'motorControl',
    name: 'Motor Control: Basal Ganglia & Cerebellum',
    tagline: 'Slowness, error & release across the movement disorders',
    accentColor: '#47679e',
  },
  {
    id: 'somaticSensation',
    name: 'Somatosensation & Pain Pathways',
    tagline: 'The dorsal-horn gate, sensitisation & the tract dissociations',
    accentColor: '#8c2f39',
  },
  {
    id: 'muscleContraction',
    name: 'Muscle & EC Coupling',
    tagline: 'Calcium, cross-bridges, length-tension & force-velocity',
    accentColor: '#a8452b',
  },
  {
    id: 'neuromuscularJunction',
    name: 'Neuromuscular Junction',
    tagline: 'Safety factor, fade, and telling presynaptic from postsynaptic',
    accentColor: '#7c6d00',
  },
  {
    id: 'hearing',
    name: 'Hearing & Cochlear Mechanics',
    tagline: 'The audiogram, recruitment & telling conductive from cochlear',
    accentColor: '#a06a10',
  },
  {
    id: 'vestibular',
    name: 'Vestibular System & Vertigo',
    tagline: 'Canal firing, compensation, BPPV & the head impulse',
    accentColor: '#0f7c66',
  },
  {
    id: 'vision',
    name: 'Vision & Phototransduction',
    tagline: 'Rods vs cones, dark adaptation & the pupil reflexes',
    accentColor: '#6d4fc1',
  },
  {
    id: 'cellCycle',
    name: 'Cell Cycle & Checkpoints',
    tagline: 'Four phases, three checkpoints, and every cancer drug names one',
    accentColor: '#0a72b8',
  },
  {
    id: 'micturition',
    name: 'Micturition',
    tagline: 'Bladder filling, storage and the voluntary control of voiding',
    accentColor: '#0a72b8',
  },
  {
    id: 'pregnancy',
    name: 'Maternal Physiology, Labour & Lactation',
    tagline: 'Every maternal number changes, and most look like disease',
    accentColor: '#2e7ea2',
  },
  {
    id: 'exercisePhysiology',
    name: 'Exercise Physiology',
    tagline: 'Every system answers one question: how much oxygen do the muscles need',
    accentColor: '#2e7d46',
  },
  {
    id: 'fetalCirculation',
    name: 'Fetal & Neonatal Circulation',
    tagline: 'Three shunts, and the minute two circulations become one',
    accentColor: '#0a72b8',
  },
  {
    id: 'immuneResponse',
    name: 'Immune Response',
    tagline: 'Innate to adaptive, and how memory changes everything',
    accentColor: '#8a3fb5',
  },
  {
    id: 'hypersensitivity',
    name: 'Hypersensitivity',
    tagline: 'Types I-IV, and every transfusion reaction among them',
    accentColor: '#c2258c',
  },
  {
    id: 'thermoregulation',
    name: 'Thermoregulation, Fever & Heat Illness',
    tagline: 'Fever is defended and hyperthermia is overwhelmed',
    accentColor: '#c65200',
  },
  {
    id: 'autonomicNervous',
    name: 'Autonomic Nervous System',
    tagline: 'Sympathetic/parasympathetic balance across organ effectors',
    accentColor: '#bd481a',
  },
  {
    id: 'membranePotentials',
    name: 'Membrane & Action Potentials',
    tagline: 'Ion conductances, Nernst/GHK & the action potential',
    accentColor: '#7c6d00',
  },];

function ModuleCard({ module: m, isDark }: { module: ModuleEntry; isDark: boolean }) {
  return (
    <Link href={`/module/${m.id}`} asChild>
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.card, isDark && styles.cardDark, pressed && styles.cardPressed]}>
            <View style={[styles.accent, { backgroundColor: m.accentColor }]} />
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>{m.name}</Text>
              <Text style={[styles.cardTagline, isDark && styles.textMuted]}>{m.tagline}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        data={MODULES}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ModuleCard module={item} isDark={isDark} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardDark: { backgroundColor: '#1e293b' },
  cardPressed: { opacity: 0.7 },
  accent: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  cardTagline: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  textLight: { color: '#e2e8f0' },
  textMuted: { color: '#94a3b8' },
});
