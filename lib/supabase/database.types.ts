export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_authorized_users: {
        Row: {
          approved_at: string
          is_active: boolean
          note: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string
          is_active?: boolean
          note?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string
          is_active?: boolean
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attribute_aliases: {
        Row: {
          alias_text: string
          attribute_id: string
          created_at: string
          created_by: string | null
          id: string
          language_code: string | null
          source_system: string | null
          source_value: string | null
        }
        Insert: {
          alias_text: string
          attribute_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string | null
          source_system?: string | null
          source_value?: string | null
        }
        Update: {
          alias_text?: string
          attribute_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string | null
          source_system?: string | null
          source_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attribute_aliases_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_value_sets: {
        Row: {
          archived_at: string | null
          attribute_id: string | null
          created_at: string
          id: string
          key: string
          legacy_id: string | null
          name_ar: string
          name_en: string | null
          source_metadata: Json
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          attribute_id?: string | null
          created_at?: string
          id?: string
          key: string
          legacy_id?: string | null
          name_ar: string
          name_en?: string | null
          source_metadata?: Json
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          attribute_id?: string | null
          created_at?: string
          id?: string
          key?: string
          legacy_id?: string | null
          name_ar?: string
          name_en?: string | null
          source_metadata?: Json
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_value_sets_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_values: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          label_ar: string
          label_en: string | null
          legacy_id: string | null
          raw_value: string | null
          source_metadata: Json
          sort_order: number
          status: string
          updated_at: string
          value_key: string
          value_set_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label_ar: string
          label_en?: string | null
          legacy_id?: string | null
          raw_value?: string | null
          source_metadata?: Json
          sort_order?: number
          status?: string
          updated_at?: string
          value_key: string
          value_set_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          label_ar?: string
          label_en?: string | null
          legacy_id?: string | null
          raw_value?: string | null
          source_metadata?: Json
          sort_order?: number
          status?: string
          updated_at?: string
          value_key?: string
          value_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_value_set_id_fkey"
            columns: ["value_set_id"]
            isOneToOne: false
            referencedRelation: "attribute_value_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          data_type: string
          filter_type: string | null
          id: string
          key: string
          legacy_id: string | null
          measurement_dimension_id: string | null
          name_ar: string
          name_en: string | null
          sort_order: number
          source_metadata: Json
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_type: string
          filter_type?: string | null
          id?: string
          key: string
          legacy_id?: string | null
          measurement_dimension_id?: string | null
          name_ar: string
          name_en?: string | null
          sort_order?: number
          source_metadata?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string
          filter_type?: string | null
          id?: string
          key?: string
          legacy_id?: string | null
          measurement_dimension_id?: string | null
          name_ar?: string
          name_en?: string | null
          sort_order?: number
          source_metadata?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attributes_measurement_dimension_fk"
            columns: ["measurement_dimension_id"]
            isOneToOne: false
            referencedRelation: "measurement_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_dimensions: {
        Row: {
          created_at: string
          id: string
          key: string
          name_ar: string
          name_en: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name_ar: string
          name_en?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name_ar?: string
          name_en?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      measurement_units: {
        Row: {
          created_at: string
          dimension_id: string
          id: string
          is_base: boolean
          key: string
          name_ar: string
          name_en: string | null
          status: string
          symbol: string | null
          to_base_multiplier: number
          to_base_offset: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension_id: string
          id?: string
          is_base?: boolean
          key: string
          name_ar: string
          name_en?: string | null
          status?: string
          symbol?: string | null
          to_base_multiplier?: number
          to_base_offset?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension_id?: string
          id?: string
          is_base?: boolean
          key?: string
          name_ar?: string
          name_en?: string | null
          status?: string
          symbol?: string | null
          to_base_multiplier?: number
          to_base_offset?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_units_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "measurement_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_type_attributes: {
        Row: {
          attribute_id: string
          configuration: Json
          created_at: string
          created_by: string | null
          display_order: number
          group_key: string | null
          id: string
          is_filterable: boolean
          is_required: boolean
          product_type_schema_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attribute_id: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          group_key?: string | null
          id?: string
          is_filterable?: boolean
          is_required?: boolean
          product_type_schema_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attribute_id?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          group_key?: string | null
          id?: string
          is_filterable?: boolean
          is_required?: boolean
          product_type_schema_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_type_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_type_attributes_product_type_schema_id_fkey"
            columns: ["product_type_schema_id"]
            isOneToOne: false
            referencedRelation: "product_type_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      product_type_schemas: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          source_metadata: Json
          status: string
          taxonomy_node_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          source_metadata?: Json
          status?: string
          taxonomy_node_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          source_metadata?: Json
          status?: string
          taxonomy_node_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_type_schemas_taxonomy_node_id_fkey"
            columns: ["taxonomy_node_id"]
            isOneToOne: true
            referencedRelation: "taxonomy_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      selling_unit_definitions: {
        Row: {
          archived_at: string | null
          base_selling_unit_id: string | null
          created_at: string
          id: string
          key: string
          legacy_id: string | null
          measurement_dimension_id: string | null
          name_ar: string
          name_en: string | null
          quantity_in_base: number | null
          source_metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          base_selling_unit_id?: string | null
          created_at?: string
          id?: string
          key: string
          legacy_id?: string | null
          measurement_dimension_id?: string | null
          name_ar: string
          name_en?: string | null
          quantity_in_base?: number | null
          source_metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          base_selling_unit_id?: string | null
          created_at?: string
          id?: string
          key?: string
          legacy_id?: string | null
          measurement_dimension_id?: string | null
          name_ar?: string
          name_en?: string | null
          quantity_in_base?: number | null
          source_metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "selling_unit_definitions_base_selling_unit_id_fkey"
            columns: ["base_selling_unit_id"]
            isOneToOne: false
            referencedRelation: "selling_unit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selling_unit_definitions_measurement_dimension_id_fkey"
            columns: ["measurement_dimension_id"]
            isOneToOne: false
            referencedRelation: "measurement_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_aliases: {
        Row: {
          alias_text: string
          created_at: string
          created_by: string | null
          id: string
          language_code: string | null
          source_system: string | null
          source_value: string | null
          taxonomy_node_id: string
        }
        Insert: {
          alias_text: string
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string | null
          source_system?: string | null
          source_value?: string | null
          taxonomy_node_id: string
        }
        Update: {
          alias_text?: string
          created_at?: string
          created_by?: string | null
          id?: string
          language_code?: string | null
          source_system?: string | null
          source_value?: string | null
          taxonomy_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_aliases_taxonomy_node_id_fkey"
            columns: ["taxonomy_node_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_nodes: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string | null
          legacy_id: string | null
          name_ar: string
          name_en: string | null
          node_type: string
          parent_id: string | null
          slug: string
          sort_order: number
          source_metadata: Json
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          legacy_id?: string | null
          name_ar: string
          name_en?: string | null
          node_type: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          source_metadata?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          legacy_id?: string | null
          name_ar?: string
          name_en?: string | null
          node_type?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          source_metadata?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversion_rules: {
        Row: {
          created_at: string
          id: string
          multiplier: number
          offset_value: number
          selling_unit_definition_id: string | null
          source_unit_id: string
          status: string
          target_unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          multiplier: number
          offset_value?: number
          selling_unit_definition_id?: string | null
          source_unit_id: string
          status?: string
          target_unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          multiplier?: number
          offset_value?: number
          selling_unit_definition_id?: string | null
          source_unit_id?: string
          status?: string
          target_unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_conversion_rules_selling_unit_definition_id_fkey"
            columns: ["selling_unit_definition_id"]
            isOneToOne: false
            referencedRelation: "selling_unit_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversion_rules_source_unit_id_fkey"
            columns: ["source_unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversion_rules_target_unit_id_fkey"
            columns: ["target_unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_axes: {
        Row: {
          configuration: Json
          created_at: string
          display_order: number
          id: string
          product_type_attribute_id: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          display_order?: number
          id?: string
          product_type_attribute_id: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          display_order?: number
          id?: string
          product_type_attribute_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_axes_product_type_attribute_id_fkey"
            columns: ["product_type_attribute_id"]
            isOneToOne: true
            referencedRelation: "product_type_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_constraints: {
        Row: {
          configuration: Json
          constraint_key: string
          created_at: string
          id: string
          product_type_schema_id: string
          status: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          constraint_key: string
          created_at?: string
          id?: string
          product_type_schema_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          constraint_key?: string
          created_at?: string
          id?: string
          product_type_schema_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_constraints_product_type_schema_id_fkey"
            columns: ["product_type_schema_id"]
            isOneToOne: false
            referencedRelation: "product_type_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_attribute_definition: {
        Args: { p_id: string }
        Returns: undefined
      }
      attribute_filter_compatible: {
        Args: { p_data_type: string; p_filter_type: string }
        Returns: boolean
      }
      save_attribute_definition: {
        Args: {
          p_aliases: Json
          p_data_type: string
          p_filter_type: string
          p_id: string | null
          p_key: string
          p_measurement_dimension_id: string | null
          p_name_ar: string
          p_name_en: string | null
          p_sort_order: number
        }
        Returns: string
      }
      convert_measurement_value: {
        Args: { p_value: number; p_source_unit_id: string; p_target_unit_id: string }
        Returns: number
      }
      save_measurement_unit: {
        Args: {
          p_id: string | null
          p_dimension_id: string
          p_key: string
          p_name_ar: string
          p_name_en: string | null
          p_symbol: string | null
          p_to_base_multiplier: number
          p_to_base_offset: number
          p_make_base: boolean
        }
        Returns: string
      }
      replace_product_type_attribute_assignments: {
        Args: { p_bindings: Json; p_taxonomy_node_id: string }
        Returns: undefined
      }
      replace_attribute_snapshot: {
        Args: { p_attributes: Json }
        Returns: undefined
      }
      replace_taxonomy_and_attribute_snapshots: {
        Args: { p_attributes: Json; p_nodes: Json }
        Returns: undefined
      }
      replace_taxonomy_snapshot: { Args: { p_nodes: Json }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
