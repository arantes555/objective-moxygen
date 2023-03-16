## {{kind}} `{{name}}` {{anchor refid}}

{{#if basecompoundref}}
```objectivec
@interface {{name}}{{#each basecompoundref}} : {{name}}{{/each}}
```
{{/if}}

{{briefdescription}}

{{detaileddescription}}

| Members | Descriptions |
|---|---|
{{#each filtered.members}}| [`{{cell name}}`](#{{refid}}) | {{cell summary}} |
{{/each}}

{{#each filtered.members}}
### `{{name}}` {{anchor refid}}

```objectivec
{{proto}}
```

{{briefdescription}}

{{detaileddescription}}

{{/each}}
