{{anchor refid}}
# {{kind}} `{{name}}`

{{#if basecompoundref}}
```{{language}}
@interface {{name}}{{#each basecompoundref}} : {{name}}{{/each}}
```
{{/if}}

{{briefdescription}}

{{detaileddescription}}

| Members | Descriptions |
|---|---|
{{#each filtered.members}}| [`{{cell name}}`]({#ref {{refid}} #}) | {{cell summary}} |
{{/each}}

{{#each filtered.members}}
## `{{name}}` {{anchor refid}}

```{{language}}
{{proto}}
```

{{briefdescription}}

{{detaileddescription}}

{{/each}}
