export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      <p className="mt-4 text-sm text-gray-600">백테스트 실행 중... (5~10초)</p>
    </div>
  );
}
