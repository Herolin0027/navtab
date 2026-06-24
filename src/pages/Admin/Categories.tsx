import { useState } from 'react';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: { id: string; name: string; icon: string; order: number; links: any[] };
  onEdit: (id: string, name: string, icon: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editIcon, setEditIcon] = useState(category.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {editing ? (
        <>
          <input
            value={editIcon}
            onChange={(e) => setEditIcon(e.target.value)}
            className="w-12 text-center rounded-lg px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
          />
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 rounded-lg px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
          />
          <button
            onClick={() => {
              onEdit(category.id, editName, editIcon);
              setEditing(false);
            }}
            className="rounded-lg p-1.5 text-green-500 hover:bg-green-500/10 transition"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xl">{category.icon}</span>
          <span className="flex-1 font-medium">{category.name}</span>
          <span className="text-xs text-slate-400">{category.links.length} 个网址</span>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const { data, addCategory, updateCategory, removeCategory, reorderCategories } =
    useBookmarkStore();

  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [showAdd, setShowAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.categories.findIndex((c) => c.id === active.id);
      const newIndex = data.categories.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(data.categories, oldIndex, newIndex);
      reorderCategories(newOrder.map((c) => c.id));
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory({ name: newName.trim(), icon: newIcon, order: data.categories.length });
    setNewName('');
    setNewIcon('📁');
    setShowAdd(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">分类管理</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            拖拽排序，管理你的网址分类
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          <Plus className="w-4 h-4" />
          新建分类
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-5 space-y-3">
          <div className="flex gap-3">
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-16 text-center rounded-xl px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="分类名称"
              className="flex-1 rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-xl px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="rounded-xl px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              添加
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={data.categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {data.categories.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                onEdit={(id, name, icon) => updateCategory(id, { name, icon })}
                onDelete={(id) => {
                  if (confirm('确定删除此分类及其所有网址吗？')) {
                    removeCategory(id);
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {data.categories.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          暂无分类，点击上方按钮创建
        </div>
      )}
    </div>
  );
}
