import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAppTheme } from '../../src/presentation/theme';

/**
 * The four sections of the app.
 *
 * These were four entries in a pill row at the top of the home screen, which meant the pharmacology
 * hub and the formula sheet were reachable only from the catalogue root, and `pricing` — the one
 * screen that redeems an institutional code — was reachable from nowhere at all on a device. The
 * tab bar is the iOS answer to that and puts every section under a thumb.
 *
 * The catalogue tab is a nested stack, so drilling subject → theme → module keeps the tabs in
 * place and each tier gets a real back button.
 */
export default function TabsLayout() {
  const { color } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.panel },
        headerTintColor: color.text,
        tabBarStyle: { backgroundColor: color.panel, borderTopColor: color.panelBorder },
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.textFaint,
        sceneStyle: { backgroundColor: color.bg },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Study',
          // Pinned, because each screen sets its own header title through a nested Stack.Screen
          // and that title is otherwise what the tab bar labels itself with — the Formulas tab
          // was relabelling itself "Formula Reference" and crowding its neighbours.
          tabBarLabel: 'Study',
          headerShown: false,
          tabBarIcon: ({ color: tint, size }) => <Ionicons name="grid-outline" size={size} color={tint} />,
        }}
      />
      <Tabs.Screen
        name="reference"
        options={{
          title: 'Formulas',
          tabBarLabel: 'Formulas',
          tabBarIcon: ({ color: tint, size }) => <Ionicons name="calculator-outline" size={size} color={tint} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Drugs',
          tabBarLabel: 'Drugs',
          tabBarIcon: ({ color: tint, size }) => <Ionicons name="flask-outline" size={size} color={tint} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: ({ color: tint, size }) => <Ionicons name="person-outline" size={size} color={tint} />,
        }}
      />
    </Tabs>
  );
}
