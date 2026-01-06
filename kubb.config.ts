import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginClient } from '@kubb/plugin-client';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginReactQuery } from '@kubb/plugin-react-query';

/**
 * Helper function to convert camelCase to kebab-case
 * Example: "adminControllerAddTask" -> "admin-controller-add-task"
 * This ensures all generated file names follow kebab-case convention
 */
function toKebabCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Kubb Configuration for Frontend with FastAPI Backend
 * 
 * This configuration file defines how Kubb generates TypeScript types,
 * API clients, and React Query hooks from the FastAPI backend's OpenAPI specification.
 */
const config = defineConfig({
  // Input configuration: Where to fetch the OpenAPI specification
  input: {
    // Use fixed OpenAPI spec if it exists, otherwise use original URL
    path: (() => {
      const fixedSpecPath = './temp-openapi.json';
      const fs = require('fs');
      
      if (fs.existsSync(fixedSpecPath)) {
        return fixedSpecPath;
      }
      
      if (process.env.NEXT_PUBLIC_API_URL) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, ''); // Remove trailing slash
        return `${baseUrl}/openapi.json`;
      }
      return 'http://localhost:8001/openapi.json';
    })(),
  },
  
  // Output configuration: Where to write generated files
  output: {
    path: './src/gen', // All generated code goes into src/gen directory
    clean: true, // Clean the output directory before generating new files
    write: true, // Enable file writing
    format: false, // Disable automatic formatting to prevent errors
  },
  
  // Simple hooks to prevent formatting errors
  hooks: {
    done: ['echo "✓ API generation completed"'],
  },
  
  // Plugin configuration: Define what to generate
  plugins: [
    // Plugin 1: OpenAPI Schema Plugin (required by other plugins)
    pluginOas({
      output: {
        path: './schemas', // Output: src/gen/schemas/*.json
      },
      validate: false, // Skip validation for problematic schemas
      serverIndex: 0, // Use first server in the list
      contentType: 'application/json', // Force content type
    }),

    // Plugin 2: TypeScript Types Plugin
    pluginTs({
      output: {
        path: './types', // Output: src/gen/types/*.ts
      },
      transformers: {
        name: (name: string, type?: string) => {
          if (!name) return name;
          if (type === 'file') {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),

    // Plugin 3: API Client Plugin
    pluginClient({
      output: {
        path: './client', // Output: src/gen/client/*.ts
      },
      importPath: '@kubb/plugin-client/clients/axios',
      transformers: {
        name: (name: string, type?: string) => {
          if (!name) return name;
          if (type === 'file') {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),

    // Plugin 4: React Query Hooks Plugin
    pluginReactQuery({
      output: {
        path: './hooks', // Output: src/gen/hooks/*.ts
      },
      // importPath: '@kubb/plugin-client/clients/axios',
      transformers: {
        name: (name: string, type?: string) => {
          if (!name) return name;
          if (type === 'file') {
            return toKebabCase(name);
          }
          return name;
        },
      },
    }),
  ],
}) as ReturnType<typeof defineConfig>;

export default config;