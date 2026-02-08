'use client';

import Image from 'next/image';
import { Calendar } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_at: string;
  tags: string[];
}

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="px-5 py-8">
      <h2 className="text-heading font-semibold text-foreground mb-5">
        Latest from Calvia
      </h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-shadow"
          >
            <div className="relative h-44 w-full bg-ocean-50">
              {post.image_url && (
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-50 text-sage-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-heading-sm font-semibold text-foreground leading-snug">
                {post.title}
              </h3>
              <p className="text-body-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground pt-1">
                <Calendar size={13} />
                <span>{formatDate(post.published_at)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
