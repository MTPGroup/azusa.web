export default defineAppConfig({
  ui: {
    primary: "emerald",
    button: {
      base: "transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
      variants: {
        active: {
          true: { base: "scale-[0.98] translate-y-[1px]" },
          false: { base: "scale-100" },
        },
      },
    },
  },
});
