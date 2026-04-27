export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-violet-500"></div>
      <p className="mt-4 text-sm text-slate-400">백테스트 실행 중... (5~10초)</p>
    </div>
  );
}
