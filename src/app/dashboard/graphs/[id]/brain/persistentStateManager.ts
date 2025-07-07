import { createClient } from "@/lib/supabase/client";

interface State {
  id: string;
  graph_id: string;
  name: string;
  persistent: boolean;
  starting_value: string | null;
  current_value: string;
  type: "NUMBER" | "TEXT" | "BOOLEAN";
  promptId: string;
}

class PersistentStateManager {
  private states: State[] = [];
  private graphId: string;

  constructor(graphId: string) {
    this.graphId = graphId;
  }

  async loadStates(): Promise<State[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("graph_states")
      .select("id, graph_id, name, persistent, starting_value, type, prompt_id")
      .eq("graph_id", this.graphId);

    if (error) {
      console.error("Error loading states:", error);
      throw error;
    }

    this.states = data.map((state) => ({
      id: state.id,
      graph_id: state.graph_id,
      name: state.name,
      persistent: state.persistent,
      starting_value: state.starting_value,
      current_value: state.starting_value ? state.starting_value : "0",
      type: state.type,
      promptId: state.prompt_id,
    }));

    return this.states;
  }

  getCurrentStates(): State[] {
    return [...this.states];
  }

  updateStates(updatedStates: State[]): void {
    // Update states, but handle persistence logic
    console.log("HEREEEEE UPDATING STATES", updatedStates);
    this.states = this.states.map(currentState => {
      const updatedState = updatedStates.find(s => s.id === currentState.id);
      if (!updatedState) return currentState;

      if (currentState.persistent) {
        // For persistent states, accumulate the values
        const currentValue = parseFloat(currentState.current_value) || 0;
        const newValue = parseFloat(updatedState.current_value) || 0;
        console.log("currentValue", currentValue);
        console.log("newValue", newValue);
        const accumulatedValue = currentValue + newValue;

        console.log("accumulatedValue", accumulatedValue);
        
        return {
          ...updatedState,
          current_value: accumulatedValue.toString()
        };
      } else {
        // For non-persistent states, just use the new value
        return updatedState;
      }
    });
  }

  resetNonPersistentStates(): void {
    this.states = this.states.map(state => {
      if (!state.persistent) {
        return {
          ...state,
          current_value: state.starting_value ? state.starting_value : "0"
        };
      }
      return state;
    });
  }

  getStateById(id: string): State | undefined {
    return this.states.find(state => state.id === id);
  }

  getStateByName(name: string): State | undefined {
    return this.states.find(state => state.name === name);
  }
}

export { PersistentStateManager };
export type { State };
