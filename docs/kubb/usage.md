# Kubb Usage Guide

This guide covers how to effectively use the generated API code in your React components and applications.

## Basic Usage Patterns

### 1. Simple Data Fetching

```tsx
import { useGetAssistantsQuery } from '@/gen';
import { $ } from '@/lib/kubb';

export function AssistantsList() {
  const { data, isLoading, error } = useGetAssistantsQuery($);
  
  if (isLoading) return <div>Loading assistants...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Assistants ({data?.length || 0})</h2>
      <ul>
        {data?.map(assistant => (
          <li key={assistant.id}>
            <strong>{assistant.name}</strong>
            {assistant.description && <p>{assistant.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Data Mutations

```tsx
import { useCreateAssistantMutation } from '@/gen';
import { $ } from '@/lib/kubb';
import { useState } from 'react';

export function CreateAssistantForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const createMutation = useCreateAssistantMutation($);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        name,
        description: description || undefined,
      });
      
      // Reset form
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create assistant:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Assistant'}
      </button>
    </form>
  );
}
```

## Configuration Options

### Query Configurations

The `@/lib/kubb` module provides several pre-configured options:

#### Standard Configuration (`$`)
Best for most use cases - balances performance with data freshness:

```tsx
import { useGetAssistantsQuery } from '@/gen';
import { $ } from '@/lib/kubb';

// 5-minute cache, refetch on reconnect
const { data } = useGetAssistantsQuery($);
```

#### Live Data Configuration (`$live`)
For real-time data that needs frequent updates:

```tsx
import { useGetSystemMetricsQuery } from '@/gen';
import { $live } from '@/lib/kubb';

// Refetches every 30 seconds
const { data } = useGetSystemMetricsQuery($live);
```

#### Fresh Data Configuration (`$fresh`)
For critical data that must always be current:

```tsx
import { useGetUserProfileQuery } from '@/gen';
import { $fresh } from '@/lib/kubb';

// Always refetches, no caching
const { data } = useGetUserProfileQuery($fresh);
```

#### Background Data Configuration (`$background`)
For non-critical data with minimal refetching:

```tsx
import { useGetAppConfigQuery } from '@/gen';
import { $background } from '@/lib/kubb';

// 15-minute cache, no automatic refetching
const { data } = useGetAppConfigQuery($background);
```

### Custom Configuration

You can also create custom configurations:

```tsx
import { useGetAssistantsQuery } from '@/gen';
import { withAuth } from '@/lib/kubb';

const customConfig = {
  ...withAuth,
  query: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  },
};

const { data } = useGetAssistantsQuery(customConfig);
```

## Advanced Usage Patterns

### 1. Dependent Queries

```tsx
import { useGetAssistantQuery, useGetAssistantSchemasQuery } from '@/gen';
import { $ } from '@/lib/kubb';

export function AssistantDetails({ assistantId }: { assistantId: string }) {
  // First query
  const { data: assistant, isLoading: assistantLoading } = useGetAssistantQuery({
    ...$ ,
    path: { assistantId },
  });
  
  // Dependent query - only runs when assistant is loaded
  const { data: schemas, isLoading: schemasLoading } = useGetAssistantSchemasQuery({
    ...$,
    path: { assistantId },
  }, {
    enabled: !!assistant, // Only run when assistant exists
  });
  
  if (assistantLoading) return <div>Loading assistant...</div>;
  if (!assistant) return <div>Assistant not found</div>;
  
  return (
    <div>
      <h1>{assistant.name}</h1>
      <p>{assistant.description}</p>
      
      {schemasLoading ? (
        <div>Loading schemas...</div>
      ) : (
        <div>
          <h2>Schemas ({schemas?.length || 0})</h2>
          {/* Render schemas */}
        </div>
      )}
    </div>
  );
}
```

### 2. Optimistic Updates

```tsx
import { useUpdateAssistantMutation, useGetAssistantsQuery } from '@/gen';
import { $ } from '@/lib/kubb';
import { useQueryClient } from '@tanstack/react-query';

export function AssistantEditor({ assistant }: { assistant: Assistant }) {
  const queryClient = useQueryClient();
  
  const updateMutation = useUpdateAssistantMutation({
    ...$,
    mutation: {
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['assistants'] });
        
        // Snapshot previous value
        const previousAssistants = queryClient.getQueryData(['assistants']);
        
        // Optimistically update
        queryClient.setQueryData(['assistants'], (old: Assistant[]) =>
          old?.map(a => a.id === assistant.id ? { ...a, ...variables } : a)
        );
        
        return { previousAssistants };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousAssistants) {
          queryClient.setQueryData(['assistants'], context.previousAssistants);
        }
      },
      onSettled: () => {
        // Refetch after mutation
        queryClient.invalidateQueries({ queryKey: ['assistants'] });
      },
    },
  });
  
  const handleUpdate = (updates: Partial<Assistant>) => {
    updateMutation.mutate({
      ...updates,
      assistantId: assistant.id,
    });
  };
  
  return (
    <div>
      {/* Your edit form */}
    </div>
  );
}
```

### 3. Infinite Queries

For paginated data:

```tsx
import { useGetAssistantsInfiniteQuery } from '@/gen';
import { $ } from '@/lib/kubb';

export function InfiniteAssistantsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetAssistantsInfiniteQuery({
    ...$,
    query: {
      getNextPageParam: (lastPage, pages) => {
        // Assuming your API returns pagination info
        return lastPage.hasMore ? pages.length : undefined;
      },
    },
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map(assistant => (
            <div key={assistant.id}>{assistant.name}</div>
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Handling

### 1. Component-Level Error Handling

```tsx
import { useGetAssistantsQuery } from '@/gen';
import { $ } from '@/lib/kubb';
import { AxiosError } from 'axios';

export function AssistantsWithErrorHandling() {
  const { data, isLoading, error } = useGetAssistantsQuery($);
  
  if (isLoading) return <div>Loading...</div>;
  
  if (error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response?.status === 404) {
      return <div>No assistants found</div>;
    }
    
    if (axiosError.response?.status === 401) {
      return <div>Please log in to view assistants</div>;
    }
    
    return <div>Error loading assistants: {error.message}</div>;
  }
  
  return (
    <div>
      {/* Render assistants */}
    </div>
  );
}
```

### 2. Global Error Handling

```tsx
// In your app root or query client setup
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error);
        // Handle global errors (toast notifications, etc.)
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        // Handle global mutation errors
      },
    },
  },
});
```

## Direct API Calls

Sometimes you need to make direct API calls outside of React components:

```tsx
import { getAssistants, createAssistant } from '@/gen/client';
import { withAuth } from '@/lib/kubb';

// In a utility function or server action
export async function processAssistants() {
  try {
    // Fetch assistants
    const assistants = await getAssistants(withAuth);
    
    // Create new assistant
    const newAssistant = await createAssistant({
      ...withAuth,
      data: {
        name: 'New Assistant',
        description: 'Created programmatically',
      },
    });
    
    return { assistants, newAssistant };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Type Safety

### Using Generated Types

```tsx
import type { Assistant, CreateAssistantRequest } from '@/gen/types';

// Type-safe component props
interface AssistantCardProps {
  assistant: Assistant;
  onUpdate: (updates: Partial<Assistant>) => void;
}

export function AssistantCard({ assistant, onUpdate }: AssistantCardProps) {
  const handleNameChange = (name: string) => {
    // TypeScript ensures this matches Assistant interface
    onUpdate({ name });
  };
  
  return (
    <div>
      <input
        value={assistant.name}
        onChange={(e) => handleNameChange(e.target.value)}
      />
    </div>
  );
}

// Type-safe form handling
export function useAssistantForm() {
  const [formData, setFormData] = useState<CreateAssistantRequest>({
    name: '',
    description: undefined,
  });
  
  // TypeScript will catch any type mismatches
  const updateField = <K extends keyof CreateAssistantRequest>(
    field: K,
    value: CreateAssistantRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return { formData, updateField };
}
```

## Performance Optimization

### 1. Query Key Management

```tsx
// Create consistent query keys
export const assistantKeys = {
  all: ['assistants'] as const,
  lists: () => [...assistantKeys.all, 'list'] as const,
  list: (filters: string) => [...assistantKeys.lists(), { filters }] as const,
  details: () => [...assistantKeys.all, 'detail'] as const,
  detail: (id: string) => [...assistantKeys.details(), id] as const,
};

// Use in components
const { data } = useGetAssistantsQuery({
  ...$,
  queryKey: assistantKeys.list('active'),
});
```

### 2. Selective Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';

export function useAssistantActions() {
  const queryClient = useQueryClient();
  
  const invalidateAssistants = () => {
    queryClient.invalidateQueries({ queryKey: assistantKeys.all });
  };
  
  const invalidateAssistant = (id: string) => {
    queryClient.invalidateQueries({ queryKey: assistantKeys.detail(id) });
  };
  
  return { invalidateAssistants, invalidateAssistant };
}
```

## Testing

### Mock API Responses

```tsx
// In your test files
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/assistants', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Test Assistant', description: 'Test description' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssistantsList } from './AssistantsList';

test('renders assistants list', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  render(
    <QueryClientProvider client={queryClient}>
      <AssistantsList />
    </QueryClientProvider>
  );
  
  expect(await screen.findByText('Test Assistant')).toBeInTheDocument();
});
```

## Best Practices

1. **Use appropriate configurations**: Choose the right caching strategy for your data
2. **Handle loading and error states**: Always provide feedback to users
3. **Leverage TypeScript**: Use generated types for type safety
4. **Optimize queries**: Use query keys and selective invalidation
5. **Test your components**: Mock API responses for reliable tests
6. **Monitor performance**: Use React Query DevTools in development

## Common Use Cases

### Dashboard with Real-time Metrics

```tsx
import { useGetSystemMetricsQuery } from '@/gen';
import { $live } from '@/lib/kubb';

export function SystemDashboard() {
  const { data: metrics } = useGetSystemMetricsQuery($live);
  
  return (
    <div className="dashboard">
      <div className="metric">
        <h3>CPU Usage</h3>
        <span>{metrics?.cpu_usage}%</span>
      </div>
      <div className="metric">
        <h3>Memory Usage</h3>
        <span>{metrics?.memory_usage}%</span>
      </div>
    </div>
  );
}
```

### Form with Validation

```tsx
import { useCreateAssistantMutation } from '@/gen';
import { $ } from '@/lib/kubb';
import { useForm } from 'react-hook-form';
import type { CreateAssistantRequest } from '@/gen/types';

export function AssistantForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateAssistantRequest>();
  const createMutation = useCreateAssistantMutation($);
  
  const onSubmit = (data: CreateAssistantRequest) => {
    createMutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Assistant name"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <textarea
        {...register('description')}
        placeholder="Description (optional)"
      />
      
      <button type="submit" disabled={createMutation.isPending}>
        Create Assistant
      </button>
    </form>
  );
}
```

This comprehensive usage guide should help you effectively use the generated API code in various scenarios. Remember to regenerate your API code whenever your backend changes to keep everything in sync!