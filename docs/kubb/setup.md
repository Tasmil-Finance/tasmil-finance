# Kubb Setup Guide

This guide covers the complete setup and configuration of Kubb for API code generation in your Next.js frontend.

## Prerequisites

- Node.js 18+ and pnpm
- FastAPI backend running with OpenAPI specification
- Next.js 14+ project with TypeScript

## Installation

### 1. Core Dependencies

The following Kubb packages are already installed in this project:

```json
{
  "@kubb/cli": "^4.9.3",
  "@kubb/core": "^4.9.3",
  "@kubb/plugin-client": "^4.9.3",
  "@kubb/plugin-oas": "^4.9.3",
  "@kubb/plugin-react-query": "^4.9.3",
  "@kubb/plugin-ts": "^4.9.3"
}
```

### 2. Supporting Libraries

Required for the generated code to work:

```json
{
  "axios": "^1.7.9",
  "@tanstack/react-query": "^5.85.5"
}
```

## File Structure

After setup, your project will have the following structure:

```
frontend/
├── kubb.config.ts              # Kubb configuration
├── src/
│   ├── gen/                    # Generated API code (auto-generated)
│   │   ├── index.ts           # Main exports
│   │   ├── types/             # TypeScript type definitions
│   │   ├── client/            # Axios API client functions
│   │   ├── hooks/             # React Query hooks
│   │   └── schemas/           # JSON schemas
│   └── lib/
│       └── kubb.ts            # API client configuration
├── scripts/
│   └── kubb/                  # Build scripts
│       ├── fix-openapi.js     # OpenAPI spec preprocessing
│       ├── fix-imports.js     # Post-generation import fixes
│       └── clean-temp.js      # Cleanup temporary files
└── docs/
    └── kubb/                  # Documentation
```

## Configuration Files

### 1. Kubb Configuration (`kubb.config.ts`)

The main configuration file that defines:

- **Input source**: Where to fetch OpenAPI specification
- **Output directory**: Where to generate code (`src/gen`)
- **Plugins**: What to generate (types, clients, hooks)
- **Transformers**: How to name files and functions

Key features:
- Automatic kebab-case file naming
- Environment-based API URL detection
- Fallback to local temp file for offline development

### 2. API Client Configuration (`src/lib/kubb.ts`)

Provides pre-configured Axios client with:

- **Base URL management**: Automatic API URL detection
- **Request/Response interceptors**: Logging and error handling
- **Authentication handling**: Token management and refresh
- **Query configurations**: Different caching strategies

Available configurations:
- `$`: Standard configuration (5min cache)
- `$live`: Real-time data (30s refresh)
- `$fresh`: Always fresh data (no cache)
- `$background`: Background data (15min cache)

### 3. Package Scripts

```json
{
  "generate:api": "node scripts/kubb/fix-openapi.js && kubb && node scripts/kubb/fix-imports.js && node scripts/kubb/clean-temp.js",
  "generate:api:dev": "node scripts/kubb/fix-openapi.js && kubb && node scripts/kubb/fix-imports.js"
}
```

## Environment Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001

# Optional: Custom OpenAPI endpoint
NEXT_PUBLIC_OPENAPI_URL=http://localhost:8001/openapi.json
```

### 2. Backend Requirements

Your FastAPI backend must:

1. **Expose OpenAPI specification** at `/openapi.json`
2. **Enable CORS** for your frontend domain
3. **Use consistent naming** for endpoints and models
4. **Include proper response schemas** in route definitions

Example FastAPI setup:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Your API",
    description="API for your application",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Build Process

The generation process involves several steps:

### 1. OpenAPI Preprocessing (`fix-openapi.js`)

- Fetches OpenAPI spec from backend
- Fixes common schema issues
- Saves temporary spec file for processing

### 2. Code Generation (`kubb`)

- Reads OpenAPI specification
- Generates TypeScript types
- Creates Axios client functions
- Builds React Query hooks

### 3. Post-processing (`fix-imports.js`)

- Fixes import paths in generated files
- Ensures proper module resolution
- Adds missing type exports

### 4. Cleanup (`clean-temp.js`)

- Removes temporary files
- Cleans up build artifacts

## Generated Code Structure

### Types (`src/gen/types/`)

```typescript
// Example: assistant.ts
export interface Assistant {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CreateAssistantRequest {
  name: string;
  description?: string;
}
```

### Client Functions (`src/gen/client/`)

```typescript
// Example: get-assistants.ts
import type { Assistant } from '../types';

export async function getAssistants(
  options?: AxiosRequestConfig
): Promise<Assistant[]> {
  const response = await axios.get('/assistants', options);
  return response.data;
}
```

### React Query Hooks (`src/gen/hooks/`)

```typescript
// Example: use-get-assistants-query.ts
import { useQuery } from '@tanstack/react-query';
import { getAssistants } from '../client';

export function useGetAssistantsQuery(options = {}) {
  return useQuery({
    queryKey: ['assistants'],
    queryFn: () => getAssistants(options.client),
    ...options.query,
  });
}
```

## Troubleshooting

### Common Issues

1. **OpenAPI fetch fails**
   - Check backend is running
   - Verify CORS configuration
   - Check API URL in environment variables

2. **Generation fails**
   - Validate OpenAPI specification
   - Check for circular references in schemas
   - Ensure proper response types in FastAPI routes

3. **Import errors**
   - Run `pnpm run generate:api` to fix imports
   - Check TypeScript configuration
   - Verify all dependencies are installed

### Debug Commands

```bash
# Test API connection
pnpm run test:api

# Generate with verbose output
DEBUG=kubb* pnpm run generate:api

# Check OpenAPI spec
curl http://localhost:8001/openapi.json | jq
```

## Best Practices

1. **Regular regeneration**: Run after backend API changes
2. **Version control**: Commit generated code for team consistency
3. **Environment separation**: Use different API URLs for dev/staging/prod
4. **Error handling**: Always handle loading and error states
5. **Type safety**: Use generated types throughout your application

## Next Steps

Once setup is complete, see the [Usage Guide](./usage.md) for detailed examples of how to use the generated API code in your components.