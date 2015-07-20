rename vars to use prop lookups on a 'scope' object

Rewrite vars scoped to module, manipulate at top level scope

Big issue is functions passed by reference. Could wrap in another function
- arguments object handling?
- perf issues?

Maybe a runtime? Web assembly poly fill?

Global swap table(s)?

Need to handle scoped declarations that redefine an outer variable

How to handle state transfers?
How to denote hot-swappable and cold-swappable code?
  - opt-in/out pragma comments (easy)
  - decorators (heavy-handed)
  - static analysis (too complicated)