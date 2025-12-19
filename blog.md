---
layout: page
title: Blog
permalink: /blog/
---
<ul class="blog-list">
  {% for post in site.posts %}
    <li>
      <strong>
        <a href="{{ post.url }}">{{ post.title }}</a>
      </strong><br>
      <span class="post-date">
        {{ post.date | date: "%B %d, %Y" }}
      </span>
      — {{ post.description }}
    </li>
  {% endfor %}
</ul>
