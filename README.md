# zoapi

zoapi provides a simple way to generate OpenAPI schemas using zod and a simple api.

## Installation

```bash
npm install zoapi
```

## Usage

```typescript
import { z } from 'zod';
import { Api } from 'zoapi';


const api = new Api("3.0.0", {
    title: "My API",
    version: "1.0.0",
    description: "My API description",
});

const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
});

const createUserSchema = userSchema.omit({ id: true });

api.get("/users").responds(200, z.array(userSchema)).withTags(["users"]);

api.post("/users").body(createUserSchema).responds(201, z.number().int()).withTags(["users"]);

api.get("/users/{id}").pathParams(z.object({ id: z.string() })).responds(200, userSchema).withTags(["users"]);

console.log(api.document());
```
