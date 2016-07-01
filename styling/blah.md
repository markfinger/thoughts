How to merge JS + CSS together so as to remove the artificial boundaries?

There's a bunch of interesting stuff happening in react land, but nothing as yet
that solidly solves it. This'll probably end up as one of those
'obvious in retrospect' technologies once we solve it.


---------------------

Terrible idea for merging js into css.

```
<div>
  <style>
    color: blue;
    text-align: center;
  </style>
  <span>
    <style>
      color: blue;
      text-align: center;
      if (this.foo) {
        text-align: left;
      } else {

      }
      span {
        color: blue;
      }
      @media (max-width: 200px) {
        color: blue;
      }
    </style>
    foo
  </span>
</div>
```
