rename vars to use prop lookups on a 'scope' object

Rewrite vars scoped to module, manipulate at top level scope

Big issue is functions passed by reference. Could wrap in another function
. arguments object handling?
. perf issues?

Maybe a runtime? Web assembly poly fill?

https://ssrg.nicta.com.au/publications/papers/Baumann_KADKW_05.pdf

http://elm-lang.org/blog/interactive-programming

Global swap table(s)?

Need to handle scoped declarations that redefine an outer variable

How to handle state transfers?
  - denote hot swappable/cold-swappable code
    - opt-in/out pragma comments
  
