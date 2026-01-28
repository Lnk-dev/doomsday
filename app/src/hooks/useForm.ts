/**
 * useForm Hook
 *
 * A custom hook for managing form state with validation support.
 * Features:
 * - Field value management
 * - Validation on change and blur
 * - Touched state tracking
 * - Form submission handling
 * - Error state management
 */

import { useState, useCallback, useMemo } from 'react'
import { validateField, type ValidationRule, type ValidationResult } from '@/lib/validation'

export interface FieldConfig<T = string> {
  initialValue: T
  rules?: ValidationRule<T>[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export interface FieldState<T = string> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
}

export interface UseFormConfig<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FieldConfig<T[K]> }
  onSubmit?: (values: T) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export interface FormField<T = string> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
  onChange: (value: T) => void
  onBlur: () => void
  reset: () => void
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  values: T
  errors: { [K in keyof T]?: string }
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void
  validateField: <K extends keyof T>(field: K) => ValidationResult
  validateForm: () => boolean
}

/**
 * Custom hook for form state management with validation
 */
export function useForm<T extends Record<string, unknown>>(
  config: UseFormConfig<T>
): UseFormReturn<T> {
  const { fields: fieldConfigs, onSubmit, validateOnChange = false, validateOnBlur = true } = config

  // Initialize field states (only run once on mount)
  const initialStates = useMemo(
    () => {
      const states: Record<string, FieldState<unknown>> = {}
      for (const key in fieldConfigs) {
        states[key] = {
          value: fieldConfigs[key].initialValue,
          touched: false,
          dirty: false,
        }
      }
      return states as { [K in keyof T]: FieldState<T[K]> }
    },
    // Intentionally only run once on mount - fieldConfigs is stable from config
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [fieldStates, setFieldStates] = useState(initialStates)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate a single field
  const validateSingleField = useCallback(
    <K extends keyof T>(fieldName: K): ValidationResult => {
      const fieldConfig = fieldConfigs[fieldName]
      const fieldState = fieldStates[fieldName]
      const rules = fieldConfig.rules || []

      if (rules.length === 0) {
        return { isValid: true }
      }

      return validateField(fieldState.value, rules as ValidationRule<T[K]>[])
    },
    [fieldConfigs, fieldStates]
  )

  // Update a field's value
  const setFieldValue = useCallback(
    <K extends keyof T>(fieldName: K, value: T[K]) => {
      setFieldStates((prev) => {
        const newState = { ...prev }
        newState[fieldName] = {
          ...prev[fieldName],
          value,
          dirty: value !== fieldConfigs[fieldName].initialValue,
        }

        // Validate on change if enabled
        const fieldConfig = fieldConfigs[fieldName]
        const shouldValidate =
          fieldConfig.validateOnChange ?? validateOnChange
        if (shouldValidate && fieldConfig.rules && fieldConfig.rules.length > 0) {
          const result = validateField(value, fieldConfig.rules as ValidationRule<T[K]>[])
          newState[fieldName].error = result.error
        }

        return newState
      })
    },
    [fieldConfigs, validateOnChange]
  )

  // Set a field's error manually
  const setFieldError = useCallback(
    <K extends keyof T>(fieldName: K, error: string | undefined) => {
      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error,
        },
      }))
    },
    []
  )

  // Handle field blur
  const handleBlur = useCallback(
    <K extends keyof T>(fieldName: K) => {
      setFieldStates((prev) => {
        const newState = { ...prev }
        newState[fieldName] = {
          ...prev[fieldName],
          touched: true,
        }

        // Validate on blur if enabled
        const fieldConfig = fieldConfigs[fieldName]
        const shouldValidate = fieldConfig.validateOnBlur ?? validateOnBlur
        if (shouldValidate && fieldConfig.rules && fieldConfig.rules.length > 0) {
          const result = validateField(
            prev[fieldName].value,
            fieldConfig.rules as ValidationRule<T[K]>[]
          )
          newState[fieldName].error = result.error
        }

        return newState
      })
    },
    [fieldConfigs, validateOnBlur]
  )

  // Reset a single field
  const resetField = useCallback(
    <K extends keyof T>(fieldName: K) => {
      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          value: fieldConfigs[fieldName].initialValue,
          touched: false,
          dirty: false,
          error: undefined,
        },
      }))
    },
    [fieldConfigs]
  )

  // Reset entire form
  const reset = useCallback(() => {
    const states: Record<string, FieldState<unknown>> = {}
    for (const key in fieldConfigs) {
      states[key] = {
        value: fieldConfigs[key].initialValue,
        touched: false,
        dirty: false,
      }
    }
    setFieldStates(states as { [K in keyof T]: FieldState<T[K]> })
  }, [fieldConfigs])

  // Validate entire form
  const validateFormFields = useCallback((): boolean => {
    let isValid = true
    const newStates = { ...fieldStates }

    for (const key in fieldConfigs) {
      const fieldConfig = fieldConfigs[key]
      if (fieldConfig.rules && fieldConfig.rules.length > 0) {
        const result = validateField(
          fieldStates[key].value,
          fieldConfig.rules as ValidationRule<T[typeof key]>[]
        )
        newStates[key] = {
          ...newStates[key],
          error: result.error,
          touched: true,
        }
        if (!result.isValid) {
          isValid = false
        }
      }
    }

    setFieldStates(newStates)
    return isValid
  }, [fieldConfigs, fieldStates])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      const isValid = validateFormFields()
      if (!isValid || !onSubmit) {
        return
      }

      setIsSubmitting(true)
      try {
        const values: Record<string, unknown> = {}
        for (const key in fieldStates) {
          values[key] = fieldStates[key].value
        }
        await onSubmit(values as T)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateFormFields, onSubmit, fieldStates]
  )

  // Build field objects
  const fields = useMemo(() => {
    const result: Record<string, FormField<unknown>> = {}
    for (const key in fieldConfigs) {
      const state = fieldStates[key]
      result[key] = {
        value: state.value,
        error: state.error,
        touched: state.touched,
        dirty: state.dirty,
        onChange: (value: unknown) => setFieldValue(key as keyof T, value as T[keyof T]),
        onBlur: () => handleBlur(key as keyof T),
        reset: () => resetField(key as keyof T),
      }
    }
    return result as { [K in keyof T]: FormField<T[K]> }
  }, [fieldStates, fieldConfigs, setFieldValue, handleBlur, resetField])

  // Extract values
  const values = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const key in fieldStates) {
      result[key] = fieldStates[key].value
    }
    return result as T
  }, [fieldStates])

  // Extract errors
  const errors = useMemo(() => {
    const result: Record<string, string | undefined> = {}
    for (const key in fieldStates) {
      result[key] = fieldStates[key].error
    }
    return result as { [K in keyof T]?: string }
  }, [fieldStates])

  // Check if form is valid (no errors)
  const isValid = useMemo(() => {
    for (const key in fieldStates) {
      if (fieldStates[key].error) {
        return false
      }
    }
    return true
  }, [fieldStates])

  // Check if any field is dirty
  const isDirty = useMemo(() => {
    for (const key in fieldStates) {
      if (fieldStates[key].dirty) {
        return true
      }
    }
    return false
  }, [fieldStates])

  return {
    fields,
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    validateField: validateSingleField,
    validateForm: validateFormFields,
  }
}

export default useForm
