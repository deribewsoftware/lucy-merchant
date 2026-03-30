import { randomUUID } from "crypto";
import type { ProductComment } from "@/lib/domain/types";
import { readJsonFile, writeJsonFile } from "@/lib/store/json-file";

const FILE = "product-comments.json";

function normalizeComment(c: ProductComment): ProductComment {
  return {
    ...c,
    likedBy: Array.isArray(c.likedBy) ? c.likedBy : [],
  };
}

export function listCommentsForProduct(productId: string): ProductComment[] {
  const all = readJsonFile<ProductComment[]>(FILE, []);
  return all
    .filter((c) => c.productId === productId)
    .map(normalizeComment)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listAllProductComments(): ProductComment[] {
  return readJsonFile<ProductComment[]>(FILE, []).map(normalizeComment);
}

export function getProductCommentById(commentId: string): ProductComment | undefined {
  const all = readJsonFile<ProductComment[]>(FILE, []);
  const c = all.find((x) => x.id === commentId);
  return c ? normalizeComment(c) : undefined;
}

export function deleteCommentsForProduct(productId: string): void {
  const all = readJsonFile<ProductComment[]>(FILE, []);
  const next = all.filter((c) => c.productId !== productId);
  if (next.length !== all.length) writeJsonFile(FILE, next);
}

export function deleteProductCommentById(commentId: string): boolean {
  const all = readJsonFile<ProductComment[]>(FILE, []);
  const remove = new Set<string>([commentId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of all) {
      if (
        c.parentId &&
        remove.has(c.parentId) &&
        !remove.has(c.id)
      ) {
        remove.add(c.id);
        changed = true;
      }
    }
  }
  const next = all.filter((c) => !remove.has(c.id));
  if (next.length === all.length) return false;
  writeJsonFile(FILE, next);
  return true;
}

export function toggleCommentLike(
  commentId: string,
  userId: string,
): ProductComment | undefined {
  const all = readJsonFile<ProductComment[]>(FILE, []);
  const i = all.findIndex((c) => c.id === commentId);
  if (i === -1) return undefined;
  const cur = normalizeComment(all[i]);
  const set = new Set(cur.likedBy ?? []);
  if (set.has(userId)) set.delete(userId);
  else set.add(userId);
  const updated: ProductComment = {
    ...cur,
    likedBy: [...set],
  };
  all[i] = updated;
  writeJsonFile(FILE, all);
  return updated;
}

export function addProductComment(input: {
  productId: string;
  userId: string;
  userName: string;
  comment: string;
  parentId: string | null;
}): ProductComment {
  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Comment cannot be empty");
  }
  const all = readJsonFile<ProductComment[]>(FILE, []);
  if (input.parentId) {
    const parent = all.find(
      (c) => c.id === input.parentId && c.productId === input.productId,
    );
    if (!parent) {
      throw new Error("Invalid parent comment");
    }
  }
  const row: ProductComment = {
    id: randomUUID(),
    productId: input.productId,
    userId: input.userId,
    userName: input.userName,
    comment,
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
    likedBy: [],
  };
  all.push(row);
  writeJsonFile(FILE, all);
  return row;
}
