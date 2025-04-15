export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      graph_conditional_node_conditions: {
        Row: {
          conditional_operator: Database["public"]["Enums"]["conditional_operator"]
          created_at: string
          graph_conditional_node_id: string
          graph_node_id: string | null
          id: string
          state_id: string
          value: string | null
        }
        Insert: {
          conditional_operator?: Database["public"]["Enums"]["conditional_operator"]
          created_at?: string
          graph_conditional_node_id: string
          graph_node_id?: string | null
          id?: string
          state_id: string
          value?: string | null
        }
        Update: {
          conditional_operator?: Database["public"]["Enums"]["conditional_operator"]
          created_at?: string
          graph_conditional_node_id?: string
          graph_node_id?: string | null
          id?: string
          state_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_conditional_node_condition_graph_conditional_node_id_fkey"
            columns: ["graph_conditional_node_id"]
            isOneToOne: false
            referencedRelation: "graph_conditional_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_conditional_node_conditions_graph_node_id_fkey"
            columns: ["graph_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_conditional_node_conditions_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "graph_states"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_conditional_nodes: {
        Row: {
          created_at: string
          false_child_id: string | null
          graph_node_id: string
          id: string
          true_child_id: string | null
        }
        Insert: {
          created_at?: string
          false_child_id?: string | null
          graph_node_id: string
          id?: string
          true_child_id?: string | null
        }
        Update: {
          created_at?: string
          false_child_id?: string | null
          graph_node_id?: string
          id?: string
          true_child_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_conditional_nodes_false_child_id_fkey"
            columns: ["false_child_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_conditional_nodes_graph_node_id_fkey"
            columns: ["graph_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_conditional_nodes_true_child_id_fkey"
            columns: ["true_child_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          created_at: string
          graph_id: string
          id: string
          label: string | null
          node_type: Database["public"]["Enums"]["node_type"]
          pos_x: number
          pos_y: number
        }
        Insert: {
          created_at?: string
          graph_id: string
          id?: string
          label?: string | null
          node_type: Database["public"]["Enums"]["node_type"]
          pos_x?: number
          pos_y?: number
        }
        Update: {
          created_at?: string
          graph_id?: string
          id?: string
          label?: string | null
          node_type?: Database["public"]["Enums"]["node_type"]
          pos_x?: number
          pos_y?: number
        }
        Relationships: [
          {
            foreignKeyName: "nodes_graph_id_fkey"
            columns: ["graph_id"]
            isOneToOne: false
            referencedRelation: "graphs"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_prompt_nodes: {
        Row: {
          created_at: string
          graph_node_id: string
          id: string
          prompt_id: string | null
        }
        Insert: {
          created_at?: string
          graph_node_id: string
          id?: string
          prompt_id?: string | null
        }
        Update: {
          created_at?: string
          graph_node_id?: string
          id?: string
          prompt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_prompt_nodes_graph_node_id_fkey"
            columns: ["graph_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_prompt_nodes_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "user_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_states: {
        Row: {
          created_at: string
          graph_id: string
          id: string
          name: string
          persistent: boolean
          prompt_id: string | null
          starting_value: string | null
          type: Database["public"]["Enums"]["state_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          graph_id: string
          id?: string
          name: string
          persistent?: boolean
          prompt_id?: string | null
          starting_value?: string | null
          type: Database["public"]["Enums"]["state_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          graph_id?: string
          id?: string
          name?: string
          persistent?: boolean
          prompt_id?: string | null
          starting_value?: string | null
          type?: Database["public"]["Enums"]["state_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_states_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "user_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "states_graph_id_fkey"
            columns: ["graph_id"]
            isOneToOne: false
            referencedRelation: "graphs"
            referencedColumns: ["id"]
          },
        ]
      }
      graphs: {
        Row: {
          child_node_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          child_node_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          child_node_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graphs_child_node_id_fkey"
            columns: ["child_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graphs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_prompts: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          frequency_penalty: number
          id: string
          llm_model: Database["public"]["Enums"]["llm_model"]
          max_tokens: number
          presence_penalty: number
          public: boolean | null
          temperature: number
          top_p: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          frequency_penalty?: number
          id?: string
          llm_model?: Database["public"]["Enums"]["llm_model"]
          max_tokens?: number
          presence_penalty?: number
          public?: boolean | null
          temperature?: number
          top_p?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          frequency_penalty?: number
          id?: string
          llm_model?: Database["public"]["Enums"]["llm_model"]
          max_tokens?: number
          presence_penalty?: number
          public?: boolean | null
          temperature?: number
          top_p?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          openai_api_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          openai_api_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          openai_api_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conditional_operator:
        | "EQUALS"
        | "NOT_EQUALS"
        | "LESS_THAN"
        | "LESS_THAN_OR_EQUAL_TO"
        | "MORE_THAN"
        | "MORE_THAN_OR_EQUAL_TO"
      llm_model: "gpt-4o" | "gpt-4o-mini"
      node_type: "PROMPT" | "CONDITIONAL"
      state_type: "NUMBER" | "TEXT" | "BOOLEAN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      conditional_operator: [
        "EQUALS",
        "NOT_EQUALS",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL_TO",
        "MORE_THAN",
        "MORE_THAN_OR_EQUAL_TO",
      ],
      llm_model: ["gpt-4o", "gpt-4o-mini"],
      node_type: ["PROMPT", "CONDITIONAL"],
      state_type: ["NUMBER", "TEXT", "BOOLEAN"],
    },
  },
} as const
