const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft dark:shadow-none border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-soft-lg ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export const CardBody = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
}

export default Card
