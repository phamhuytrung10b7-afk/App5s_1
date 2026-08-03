with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# 1. Truncate at first portal
first_portal = content.find('{/* PRINT-ONLY PORTAL */}')
if first_portal != -1:
    content = content[:first_portal]

# 2. Find the preview block
preview_start = content.find('<div className="flex flex-col items-center space-y-3 pb-8">')
preview_end = content.find('</div>\n              )}\n            </div>\n          )}\n        </div>\n        {/* Footer */}')

# Wait, `preview_end` might not match exactly. Let's find `{/* Footer */}` instead.
footer_idx = content.find('{/* Footer */}')
if footer_idx != -1:
    # We want to replace from `preview_start` up to just before `</div>\n              )}\n            </div>\n          )}\n        </div>\n        {/* Footer */}`
    # To be safe, we just replace everything from `preview_start` to `footer_idx` with the new preview + the closing tags!
    
    # Wait, let's look at what's before `{/* Footer */}`
    #                 </div>
    #               )}
    #             </div>
    #           )}
    #         </div>
    
    closing_tags = """
                </div>
              )}
            </div>
          )}
        </div>
        """
    pass

