import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginClient } from '@kubb/plugin-client';
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
 * Kubb Configuration
 * 
 * This configuration file defines how Kubb generates TypeScript types,
 * API clients, and React Query hooks from the backend's OpenAPI specification.
 */
const config = defineConfig({
  // Input configuration: Where to fetch the OpenAPI specification
  input: {
    // URL of Swagger JSON from backend
    // NestJS automatically creates this endpoint at /api/docs-json
    // Uses environment variable if available, otherwise defaults to localhost:9337
    path: (() => {
      if (process.env.NEXT_PUBLIC_API_URL) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, ''); // Remove trailing slash
        // If baseUrl already includes /api, just add /docs-json
        // Otherwise add /api/docs-json
        return baseUrl.includes('/api') 
          ? `${baseUrl}/docs-json`
          : `${baseUrl}/api/docs-json`;
      }
      return 'http://localhost:9337/api/docs-json';
    })(),
  },
  
  // Output configuration: Where to write generated files
  output: {
    path: './gen', // All generated code goes into gen directory (no src/ folder in this project)
    clean: true, // Clean the output directory before generating new files
  },
  
  // Plugin configuration: Define what to generate
  plugins: [
    // Plugin 1: OpenAPI Schema Plugin
    // Generates raw OpenAPI schema JSON files
    pluginOas({
      output: {
        path: './schemas', // Output: gen/schemas/*.json
      },
    }),
    
    // Plugin 2: TypeScript Types Plugin
    // Generates TypeScript type definitions from OpenAPI schemas
    pluginTs({
      output: {
        path: './types', // Output: gen/types/*.ts
      },
      // Transform file names to kebab-case
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
    // Generates API client functions using Axios
    pluginClient({
      output: {
        path: './client', // Output: gen/client/*.ts
      },
      // Use Axios as the HTTP client
      importPath: '@kubb/plugin-client/clients/axios',
      // Transform file names to kebab-case
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
    
    // Plugin 4: React Query Plugin
    // Generates React Query hooks (useQuery, useMutation) from API endpoints
    pluginReactQuery({
      output: {
        path: './hooks', // Output: gen/hooks/**/*.ts
      },
      // Group hooks by OpenAPI tags (e.g., "admin", "campaigns", "users")
      // Creates folders like: admin-hooks/, campaigns-hooks/, etc.
      group: {
        type: 'tag', // Group by OpenAPI operation tags
        name: ({ group }) => {
          if (!group) return 'hooks';
          return `${toKebabCase(group)}-hooks`;
        },
      },
      // Client configuration for hooks
      client: {
        importPath: '@kubb/plugin-client/clients/axios', // Use Axios client
        dataReturnType: 'data', // Return response.data instead of full response
      },
      // Query hooks configuration (for GET requests)
      query: {
        methods: ['get'], // Only generate useQuery hooks for GET methods
        importPath: '@tanstack/react-query', // Import from React Query
      },
      // Mutation hooks configuration (for POST, PUT, DELETE, PATCH)
      mutation: {
        methods: ['post', 'put', 'delete', 'patch'], // Generate useMutation hooks for these methods
        importPath: '@tanstack/react-query', // Import from React Query
      },
      // Suspense hooks configuration
      // Generates suspense-compatible hooks (e.g., useCampaignsControllerFindOneSuspense)
      suspense: {},
      // Transform file names to kebab-case
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

