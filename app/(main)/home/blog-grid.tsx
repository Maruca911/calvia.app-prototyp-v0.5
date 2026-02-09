'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_at: string;
  tags: string[];
  category: string;
}

const CATEGORIES = ['All', 'Discover', 'Gastronomy', 'Lifestyle', 'Wellness', 'Property'];

export function BlogGrid({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  if (!posts.length) return null;

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="px-5 py-8">
      <h2 className="text-heading font-semibold text-foreground mb-4">
        Latest from Calvia
      </h2>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'bg-white text-muted-foreground border border-cream-300 hover:border-sage-300 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-body-sm text-muted-foreground">
            No articles in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              href={`/home/blog/${post.slug}`}
              className="block bg-white rounded-xl overflow-hidden shadow-sm border border-cream-200 hover:shadow-md transition-shadow"
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
                {post.category && (
                  <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-ocean-600 backdrop-blur-sm">
                    {post.category}
                  </span>
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
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Calendar size={13} />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  <span className="text-[13px] font-medium text-ocean-500 flex items-center gap-0.5">
                    Read more
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredPosts.length > 2 && (
            <div className="space-y-3">
              {filteredPosts.slice(2).map((post) => (
                <Link
                  key={post.id}
                  href={`/home/blog/${post.slug}`}
                  className="flex gap-3.5 p-3 bg-white rounded-xl border border-cream-200 hover:shadow-sm transition-shadow"
                >
                  <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-ocean-50 flex-shrink-0">
                    {post.image_url && (
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-1.5">
                      <Calendar size={11} />
                      <span>{formatDate(post.published_at)}</span>
                      {post.category && (
                        <>
                          <span className="mx-1">-</span>
                          <span className="text-ocean-500 font-medium">{post.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 self-center" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
