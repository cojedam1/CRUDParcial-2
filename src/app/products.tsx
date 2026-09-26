import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/database/supabase';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TaskType = {
  id: number;
  nombre: string;
  date: string;
  responsable: string;
};

export default function TasksScreen() {
  const theme = useTheme();

  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del formulario que aparece en el Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [taskEditando, settaskEditando] = useState<TaskType | null>(null);
  const [nombre, setNombre] = useState('');
  const [date, setDate] = useState('');
  const [responsable, setResponsable] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('id');

      if (error) {
        Alert.alert('Ha ocurrido un error', error.message);
        return;
      }

      // Supabase devuelve las filas sin tipos, así que las casteamos.
      setTasks((data ?? []) as TaskType[]);
    } catch (err) {
      Alert.alert('Ha ocurrido un error', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTasks();
  }, []);

  const abrirNuevo = () => {
    settaskEditando(null);
    setNombre('');
    setDate('');
    setResponsable('');
    setModalVisible(true);
  };

  const abrirEdicion = (item: TaskType) => {
    settaskEditando(item);
    setNombre(item.nombre);
    setDate(item.date);
    setResponsable(item.responsable);
    setModalVisible(true);
  };

  const guardarTask = async () => {
    if (!nombre.trim() || !date.trim() || !responsable.trim()) {
      Alert.alert('Datos incompletos', 'Todos los campos son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: nombre.trim(),
        date: date.trim(),
        responsable: responsable.trim(),
      };

      // Si hay una tarea en edición hacemos UPDATE, si no, INSERT.
      const resultado = taskEditando
        ? await supabase.from('tasks').update(datos).eq('id', taskEditando.id)
        : await supabase.from('tasks').insert(datos);

      if (resultado.error) {
        Alert.alert('Ha ocurrido un error', resultado.error.message);
        return;
      }

      setModalVisible(false);
      cargarTasks();
    } catch (err) {
      Alert.alert('Ha ocurrido un error', err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTask = async (item: TaskType) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', item.id);

      if (error) {
        Alert.alert('Ha ocurrido un error', error.message);
        return;
      }

      setTasks((prev) => prev.filter((t) => t.id !== item.id));
    } catch (err) {
      Alert.alert('Ha ocurrido un error', err instanceof Error ? err.message : String(err));
    }
  };

  const confirmarEliminacion = (item: TaskType) => {
    // En web, Alert.alert no muestra diálogos; usamos el confirm del navegador.
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`¿Deseas eliminar "${item.nombre}"?`)) {
        eliminarTask(item);
      }
      return;
    }

    Alert.alert('Eliminar tarea', `¿Deseas eliminar "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarTask(item) },
    ]);
  };

  const renderItem = ({ item }: { item: TaskType }) => (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.cardInfo}>
        <ThemedText type="smallBold">{item.nombre}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fecha: {item.date}
        </ThemedText>
        <ThemedText type="smallBold">{item.responsable}</ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.cardActions}>
        <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => abrirEdicion(item)}>
          <ThemedView type="backgroundSelected" style={styles.editButton}>
            <ThemedText type="small" style={styles.editButtonText}>
              Editar
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => confirmarEliminacion(item)}>
          <ThemedView style={styles.deleteButton}>
            <ThemedText type="small" style={styles.deleteButtonText}>
              Eliminar
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Tareas</ThemedText>
          <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={abrirNuevo}>
            <ThemedView type="backgroundSelected" style={styles.newProductButton}>
              <ThemedText type="small" style={styles.editButtonText}>
                + Nueva tarea
              </ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Cargando tareas…
          </ThemedText>
        ) : tasks.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            No hay tareas registradas.
          </ThemedText>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <ThemedText type="subtitle">
              {taskEditando ? 'Editar tarea' : 'Nueva tarea'}
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.field}>
              <ThemedText type="smallBold">Nombre</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tarea"
                placeholderTextColor={theme.textSecondary}
              />
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.field}>
              <ThemedText type="smallBold">Fecha</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                value={date}
                onChangeText={setDate}
                placeholder="Fecha"
                placeholderTextColor={theme.textSecondary}
              />
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.field}>
              <ThemedText type="smallBold">Responsable</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                value={responsable}
                onChangeText={setResponsable}
                placeholder="Carlos Ojeda"
                placeholderTextColor={theme.textSecondary}
              />
            </ThemedView>

            <Pressable disabled={guardando} style={({ pressed }) => pressed && styles.pressed} onPress={guardarTask}>
              <ThemedView type="backgroundSelected" style={styles.saveButton}>
                <ThemedText type="small" style={styles.saveButtonText}>
                  {guardando ? 'Guardando…' : 'Guardar tarea'}
                </ThemedText>
              </ThemedView>
            </Pressable>

            <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => setModalVisible(false)}>
              <ThemedView style={styles.cancelButton}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancelar
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    alignSelf: 'stretch',
  },
  newProductButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  listContent: {
    width: '100%',
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2E135',
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
