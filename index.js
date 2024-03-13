function test(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
  return "foo"
  debugger;
}

function nestedIfTest() {
  if (true) {
    if (1 == 1) {
      if (2 == 2) {
        return 2
      }
      return 1
    }
    return 3
  }
}