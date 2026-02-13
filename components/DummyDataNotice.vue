<template lang="pug">
.dummy-data-notice
  .notice-content
    .notice-text
      span #[strong This is demo data.] You are viewing the default tenant with sample data. 
      NuxtLink(to="/about") Learn more.
</template>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .dummy-data-notice {
    background: linear-gradient(135deg, #17a2b8 0%, color.adjust(#17a2b8, $lightness: -10%) 100%);
    color: white;
    padding: $spacing-sm $spacing-lg;
    margin: -16px 0 26px 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .notice-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;

      gap: $spacing-sm;
      align-items: center;

      .notice-text {
        font-size: 0.95rem;
        line-height: 1.5;
        display: flex;
        flex-wrap: wrap;
        column-gap: 1em;
        row-gap: 0.25em;
        padding-left: 1em;

        strong {
          font-weight: 700;
        }
        a {
          color: $text-dark;
          font-weight: 725;
          &:hover,
          &:focus {
            text-decoration: underline;
          }
        }
      }
    }
  }
</style>
