<template>
  <div class="header">
    <RouterLink to="/">
      <svg
        id="s-0"
        xmlns="http://www.w3.org/2000/svg"
        x="0"
        y="0"
        viewBox="0 0 228 232"
        xml:space="preserve"
      >
        <g transform="translate(-.606 .146)">
          <g transform="translate(.24 -.058)" id="tight-bounds">
            <g id="icon-0">
              <path
                class="st3"
                d="m64 70.7 14.5 15.1-25.7-4.4-2.2-10.9z"
                transform="translate(24.992 16.068)"
              />
              <path
                class="st3"
                d="m158.6 38.8-1.7-30.4-7.3-24.1L109.4 16 94 17.4 78.8 16 38.6-15.7 31.3 8.4l-1.7 30.4L1 124.9l93 90.5 93.1-90.5-28.5-86.1zM8.5 123.4l24.2-82.5 19-20.9L94 27.1l42.5-7.1 19 20.9 24.2 82.5L94 197.3 8.5 123.4z"
                transform="translate(24.992 16.068)"
              />
              <path
                class="st3"
                d="m124.2 70.7-14.5 15.1 25.7-4.4 2.2-10.9z"
                transform="translate(24.992 16.068)"
              />
              <path
                class="st3"
                d="m174.3 114.6-19.3-28 9.2 19.3-10.1-4.4 1.6 10.7-11.7-3.9-17.4 16-6.2 20.8-5.5 8.4-5.8 2.4h-7.7l9.8-12.7 1-9.2-4-14.3-4-17.2 5.5-16.8-9.4 16.8 3.6 17.8 6.2 14.4-16.1 5.2-16-5.1 6.2-14.4 3.6-17.8-9.4-16.8 5.5 16.8-4 17.2-4 14.3 1 9.2 9.8 12.7H79l-5.8-2.4-5.5-8.4-6.2-20.8-17.4-16-11.8 3.9 1.6-10.7-9.9 4.3 9.2-19.3-19.3 28 13.7-5.9-1.5 10.9 16.6-5L58.3 127l6.8 19.9 6.2 9.2 6.5 2.7 1 7.1 15.2 7.4 15.3-7.4 1-7.1 6.5-2.7 6.2-9.2 6.8-19.9 15.6-12.4 16.6 5-1.5-10.9 13.8 5.9zm-68 49.9-12.2 4.4-12.2-4.4-.1-5.9L94 156l12.4 2.5-.1 6z"
                transform="translate(24.992 16.068)"
              />
            </g>
          </g>
        </g>
      </svg>
      <p>helicoder project</p>
    </RouterLink>

<!--    TODO Add info to abt page-->
    <!--    <nav>-->
<!--      <RouterLink to="/about">About author</RouterLink>-->
<!--    </nav>-->
  </div>
</template>

<script>
import { RouterLink } from 'vue-router';

export default {
  components: { RouterLink },
};
</script>

<style scoped>
.header {
  display: flex;
  padding-inline: 20px;
  justify-content: center;
  align-items: center;
  padding-block: 20px;
}
a:first-of-type {
  display: flex;
  align-items: center;
}
a:first-of-type svg {
  height: 70px;
  margin-right: 15px;
}
p {
  font-family: 'Yatra One', sans-serif;
  text-transform: uppercase;
  letter-spacing: -2px;
  font-size: 24px;
  font-weight: 600;
}

nav {
  display: flex;
}
nav a {
  font-weight: 600;
  text-transform: uppercase;
  padding-inline: 5px;
  font-size: 20px;
  cursor: pointer;
}
</style>
